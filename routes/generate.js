const crypto = require('crypto');
const path = require('path');
const { UploadFile } = require('../lib/OSS');
const { readBody, sendJson } = require('../lib/http');
const { tryGetImageSize } = require('../lib/image');
const { getProvider } = require('../providers');
const { ProviderError } = require('../providers/errors');
const { getAuthUser } = require('../services/auth');
const { getMonthKey, reserveQuota, adjustQuota, getQuota } = require('../services/quota');

const jobStore = new Map(); // jobId -> { status, createdAt, doneAt, result }
const JOB_TTL_MS = 60 * 60 * 1000;
const JOB_MAX = 500;

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl || ''));
  if (!match) throw new Error('Invalid dataUrl');
  const mime = match[1].toLowerCase();
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');
  return { mime, buffer };
}

function mimeToExt(mime) {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  return '';
}

function pruneJobs() {
  const now = Date.now();
  for (const [id, job] of jobStore.entries()) {
    const ts = job?.doneAt || job?.createdAt || 0;
    if (now - ts > JOB_TTL_MS) jobStore.delete(id);
  }
  // basic cap: delete oldest
  if (jobStore.size <= JOB_MAX) return;
  const ids = Array.from(jobStore.entries())
    .sort((a, b) => (a[1]?.createdAt || 0) - (b[1]?.createdAt || 0))
    .slice(0, Math.max(0, jobStore.size - JOB_MAX))
    .map((x) => x[0]);
  for (const id of ids) jobStore.delete(id);
}

async function parseAndAuth({ req, res, pool }) {
  let user;
  try {
    user = await getAuthUser({ pool, req });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return null;
  }
  if (!user) {
    sendJson(res, 401, { error: '请先登录' });
    return null;
  }

  let body;
  try {
    body = await readBody(req, { maxBytes: 60 * 1024 * 1024 });
  } catch (err) {
    if (err?.code === 'PAYLOAD_TOO_LARGE') {
      sendJson(res, 413, { error: 'Payload too large (max 60MB)' });
      return null;
    }
    sendJson(res, 400, { error: 'Failed to read request body' });
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(body.toString('utf8'));
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON' });
    return null;
  }

  return { user, parsed };
}

function validateRequest(parsed) {
  const modeRaw = String(parsed?.mode || 'img2img');
  const mode = modeRaw === 'txt2img' ? 'txt2img' : 'img2img';
  const modelId = String(parsed?.modelId || 'dashscope');
  const provider = getProvider(modelId);
  if (!provider) return { ok: false, statusCode: 400, payload: { error: `Unknown modelId: ${modelId}` } };

  const prompt = String(parsed?.prompt || '').trim();
  const nRaw = Number(parsed?.n);
  const isNanoModel = modelId === 'google-nano-banana-pro';
  const isDashScope = modelId === 'dashscope';
  const maxN = isNanoModel ? 1 : (isDashScope ? 4 : 6);
  const defaultN = isNanoModel ? 1 : 2;
  const n = Number.isFinite(nRaw) ? Math.max(1, Math.min(maxN, Math.floor(nRaw))) : defaultN;
  const images = Array.isArray(parsed?.images) ? parsed.images : [];
  const hd = Boolean(parsed?.hd);
  const aspectRatio = parsed?.aspectRatio == null ? null : String(parsed.aspectRatio).trim();

  if (!prompt) return { ok: false, statusCode: 400, payload: { error: 'Prompt is required' } };
  if (images.length > 3) return { ok: false, statusCode: 400, payload: { error: 'At most 3 input images are allowed' } };
  if (mode === 'img2img' && images.length === 0) {
    return { ok: false, statusCode: 400, payload: { error: 'At least 1 image is required' } };
  }

  return { ok: true, mode, modelId, provider, prompt, n, images, hd, aspectRatio };
}

async function runGenerate({
  user,
  parsed,
  axios,
  pool,
  dc,
  ai,
  nanoai,
  monthlyLimit,
  providerTimeoutMsDashScope,
  providerTimeoutMsNanoAi,
}) {
  const v = validateRequest(parsed);
  if (!v.ok) return { statusCode: v.statusCode, payload: v.payload };
  const { mode, modelId, provider, prompt, n, images, hd, aspectRatio } = v;

  const month = getMonthKey(new Date());
  let reservation;
  try {
    reservation = await reserveQuota({ pool, userId: user.id, month, count: n, monthlyLimit });
  } catch (err) {
    return { statusCode: 500, payload: { error: `DB error: ${err?.message || String(err)}` } };
  }
  if (!reservation.ok) {
    return { statusCode: 429, payload: { error: '本月额度不足', quota: reservation.quota } };
  }

  const uploadedUrls = [];
  const inputDims = [];
  try {
    for (const item of images) {
      const filename = String(item?.name || 'image');
      const { mime, buffer } = parseDataUrl(item?.dataUrl);
      inputDims.push(tryGetImageSize(buffer, mime));
      const ext = mimeToExt(mime) || path.extname(filename).toLowerCase() || '.bin';
      const key = path.posix.join(
        dc?.ossFilePath ? String(dc.ossFilePath) : 'ai-image',
        'web',
        `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`
      );

      const url = await UploadFile(key, buffer, { mime });
      uploadedUrls.push(url);
    }
  } catch (err) {
    await adjustQuota({ pool, userId: user.id, month, delta: -reservation.reserved }).catch(() => {});
    return { statusCode: 500, payload: { error: `OSS upload failed: ${err?.message || String(err)}` } };
  }

  const baseDim = inputDims.length ? inputDims[inputDims.length - 1] : null;
  const timeoutMs = modelId === 'google-nano-banana-pro' ? providerTimeoutMsNanoAi : providerTimeoutMsDashScope;

  try {
    const result = await provider.generate({
      axios,
      ai,
      nanoai,
      env: process.env,
      mode,
      prompt,
      n,
      hd,
      aspectRatio,
      uploadedUrls,
      baseDim,
      timeoutMs,
    });

    const outputImageUrls = Array.isArray(result?.outputImageUrls) ? result.outputImageUrls : [];
    const actual = outputImageUrls.length;
    const refund = Math.max(0, reservation.reserved - actual);
    if (refund) {
      await adjustQuota({ pool, userId: user.id, month, delta: -refund }).catch(() => {});
    }
    const quota = await getQuota({ pool, userId: user.id, month, monthlyLimit });
    return { statusCode: 200, payload: { inputImageUrls: uploadedUrls, outputImageUrls, quota, raw: result?.raw } };
  } catch (err) {
    await adjustQuota({ pool, userId: user.id, month, delta: -reservation.reserved }).catch(() => {});
    if (err instanceof ProviderError) {
      return { statusCode: err.statusCode, payload: err.payload };
    }
    return { statusCode: 502, payload: { error: err?.message || String(err), inputImageUrls: uploadedUrls } };
  }
}

async function generate(deps) {
  const { req, res, pool } = deps;
  const auth = await parseAndAuth({ req, res, pool });
  if (!auth) return;
  const result = await runGenerate({ ...deps, ...auth });
  sendJson(res, result.statusCode, result.payload);
}

async function generateAsyncStart(deps) {
  const { req, res, pool } = deps;
  pruneJobs();
  const auth = await parseAndAuth({ req, res, pool });
  if (!auth) return;

  const v = validateRequest(auth.parsed);
  if (!v.ok) {
    sendJson(res, v.statusCode, v.payload);
    return;
  }

  const jobId = crypto.randomBytes(12).toString('hex');
  jobStore.set(jobId, { status: 'running', createdAt: Date.now(), doneAt: null, result: null });

  // run in background
  (async () => {
    const job = jobStore.get(jobId);
    if (!job) return;
    try {
      const result = await runGenerate({ ...deps, ...auth });
      job.status = 'done';
      job.doneAt = Date.now();
      job.result = result;
    } catch (err) {
      job.status = 'done';
      job.doneAt = Date.now();
      job.result = { statusCode: 500, payload: { error: err?.message || String(err) } };
    }
  })();

  sendJson(res, 202, { jobId });
}

function generateAsyncStatus({ req, res }) {
  pruneJobs();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const jobId = String(url.searchParams.get('jobId') || '');
  if (!jobId) {
    sendJson(res, 400, { error: 'jobId is required' });
    return;
  }
  const job = jobStore.get(jobId);
  if (!job) {
    sendJson(res, 404, { error: 'job not found' });
    return;
  }
  if (job.status !== 'done') {
    sendJson(res, 200, { status: job.status });
    return;
  }
  sendJson(res, 200, { status: 'done', result: job.result });
}

module.exports = { generate, generateAsyncStart, generateAsyncStatus };
