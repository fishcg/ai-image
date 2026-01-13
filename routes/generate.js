const crypto = require('crypto');
const path = require('path');
const { UploadFile } = require('../lib/OSS');
const { readBody, sendJson } = require('../lib/http');
const { tryGetImageSize } = require('../lib/image');
const { getProvider } = require('../providers');
const { ProviderError } = require('../providers/errors');
const { getAuthUser } = require('../services/auth');
const { getMonthKey, reserveQuota, adjustQuota, getQuota } = require('../services/quota');

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

async function generate({
  req,
  res,
  axios,
  pool,
  dc,
  ai,
  nanoai,
  monthlyLimit,
  providerTimeoutMsDashScope,
  providerTimeoutMsNanoAi,
}) {
  let user;
  try {
    user = await getAuthUser({ pool, req });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!user) {
    sendJson(res, 401, { error: '请先登录' });
    return;
  }

  let body;
  try {
    body = await readBody(req, { maxBytes: 60 * 1024 * 1024 });
  } catch (err) {
    if (err?.code === 'PAYLOAD_TOO_LARGE') {
      sendJson(res, 413, { error: 'Payload too large (max 60MB)' });
      return;
    }
    sendJson(res, 400, { error: 'Failed to read request body' });
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(body.toString('utf8'));
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const modelId = String(parsed?.modelId || 'dashscope');
  const provider = getProvider(modelId);
  if (!provider) {
    sendJson(res, 400, { error: `Unknown modelId: ${modelId}` });
    return;
  }

  const prompt = String(parsed?.prompt || '').trim();
  const nRaw = Number(parsed?.n);
  const n = Number.isFinite(nRaw) ? Math.max(1, Math.min(6, Math.floor(nRaw))) : 2;
  const images = Array.isArray(parsed?.images) ? parsed.images : [];
  const hd = Boolean(parsed?.hd);

  if (!prompt) {
    sendJson(res, 400, { error: 'Prompt is required' });
    return;
  }
  if (images.length === 0) {
    sendJson(res, 400, { error: 'At least 1 image is required' });
    return;
  }
  if (images.length > 3) {
    sendJson(res, 400, { error: 'At most 3 input images are allowed' });
    return;
  }

  const month = getMonthKey(new Date());
  let reservation;
  try {
    reservation = await reserveQuota({ pool, userId: user.id, month, count: n, monthlyLimit });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!reservation.ok) {
    sendJson(res, 429, { error: '本月额度不足', quota: reservation.quota });
    return;
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
    sendJson(res, 500, { error: `OSS upload failed: ${err?.message || String(err)}` });
    return;
  }

  const baseDim = inputDims.length ? inputDims[inputDims.length - 1] : null;
  const timeoutMs = modelId === 'google-nano-banana-pro' ? providerTimeoutMsNanoAi : providerTimeoutMsDashScope;

  try {
    const result = await provider.generate({
      axios,
      ai,
      nanoai,
      env: process.env,
      prompt,
      n,
      hd,
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
    sendJson(res, 200, { inputImageUrls: uploadedUrls, outputImageUrls, quota, raw: result?.raw });
  } catch (err) {
    await adjustQuota({ pool, userId: user.id, month, delta: -reservation.reserved }).catch(() => {});
    if (err instanceof ProviderError) {
      sendJson(res, err.statusCode, err.payload);
      return;
    }
    sendJson(res, 502, { error: err?.message || String(err), inputImageUrls: uploadedUrls });
  }
}

module.exports = { generate };
