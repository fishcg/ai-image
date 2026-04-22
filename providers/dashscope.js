const { ProviderError } = require('./errors');

function clampInt(n, min, max) {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function roundDownToMultiple(n, multiple) {
  const m = Math.max(1, Math.floor(multiple));
  return Math.max(m, Math.floor(n / m) * m);
}

function buildDashScopeSize(dim, { maxSide = 2048, multiple = 64, forceMaxSide = false } = {}) {
  if (!dim?.width || !dim?.height) return null;
  const w0 = Number(dim.width);
  const h0 = Number(dim.height);
  if (!Number.isFinite(w0) || !Number.isFinite(h0) || w0 <= 0 || h0 <= 0) return null;

  let w;
  let h;
  if (forceMaxSide) {
    if (w0 >= h0) {
      w = maxSide;
      h = Math.max(1, Math.round((maxSide * h0) / w0));
    } else {
      h = maxSide;
      w = Math.max(1, Math.round((maxSide * w0) / h0));
    }
  } else {
    const max0 = Math.max(w0, h0);
    const scale = max0 > maxSide ? maxSide / max0 : 1;
    w = Math.max(1, Math.round(w0 * scale));
    h = Math.max(1, Math.round(h0 * scale));
  }

  w = roundDownToMultiple(clampInt(w, 64, maxSide), multiple);
  h = roundDownToMultiple(clampInt(h, 64, maxSide), multiple);

  if (Math.max(w, h) > maxSide) {
    if (w >= h) w = roundDownToMultiple(maxSide, multiple);
    else h = roundDownToMultiple(maxSide, multiple);
  }

  return `${w}*${h}`;
}

function extractOutputImageUrls(dashscopeResponse) {
  const choices = dashscopeResponse?.output?.choices;
  if (!Array.isArray(choices)) return [];
  const urls = [];
  for (const choice of choices) {
    const content = choice?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part.image === 'string') urls.push(part.image);
    }
  }
  return urls;
}

function normalizeAspectRatio(aspectRatio) {
  const r = String(aspectRatio || '').trim();
  const allowed = new Set(['1:1', '4:3', '3:4', '16:9', '9:16']);
  return allowed.has(r) ? r : null;
}

function sizeFromAspectRatioEdit(aspectRatio, hd) {
  const r = normalizeAspectRatio(aspectRatio);
  if (!r) return null;
  const h = hd ? 2048 : 1024;
  const presets = {
    '1:1': { w: h, h },
    '4:3': { w: h, h: Math.round((h * 3) / 4) },
    '3:4': { w: Math.round((h * 3) / 4), h },
    '16:9': { w: h, h: Math.round((h * 9) / 16) },
    '9:16': { w: Math.round((h * 9) / 16), h },
  };
  const dim = presets[r];
  if (!dim?.w || !dim?.h) return null;
  const w = Math.max(64, Math.round(dim.w / 64) * 64);
  const hh = Math.max(64, Math.round(dim.h / 64) * 64);
  return `${w}*${hh}`;
}

function sizeForWanT2i(aspectRatio) {
  const r = normalizeAspectRatio(aspectRatio) || '1:1';
  const map = {
    '1:1': '1280*1280',
    '3:4': '1104*1472',
    '4:3': '1472*1104',
    '9:16': '960*1696',
    '16:9': '1696*960',
  };
  return map[r] || '1280*1280';
}

async function generate({ axios, ai, env, mode, prompt, n, hd, aspectRatio, uploadedUrls, baseDim, timeoutMs }) {
  const apiKey = env.DASHSCOPE_API_KEY || ai?.API_KEY;
  const isTxt2Img = String(mode || 'img2img') === 'txt2img';
  const apiUrl = (isTxt2Img ? (env.DASHSCOPE_T2I_URL || ai?.T2I_URL) : null) || env.DASHSCOPE_URL || ai?.URL;
  const model = isTxt2Img
    ? (env.DASHSCOPE_T2I_MODEL || ai?.T2I_MODEL || 'wan2.6-t2i')
    : (env.DASHSCOPE_MODEL || ai?.MODEL || 'qwen-image-edit-plus');

  if (!apiKey) {
    throw new ProviderError('Missing DASHSCOPE_API_KEY', { statusCode: 500, payload: { error: 'Missing DASHSCOPE_API_KEY' } });
  }

  const size = isTxt2Img
    ? sizeForWanT2i(aspectRatio)
    : (baseDim
        ? buildDashScopeSize(baseDim, { maxSide: 2048, multiple: 64, forceMaxSide: hd })
        : (sizeFromAspectRatioEdit(aspectRatio, hd) || (hd ? '2048*2048' : null)));

  const payload = {
    model,
    input: {
      messages: [
        {
          role: 'user',
          content: [...(isTxt2Img ? [] : uploadedUrls.map((url) => ({ image: url }))), { text: prompt }],
        },
      ],
    },
    parameters: {
      n,
      watermark: false,
      negative_prompt: isTxt2Img ? '' : '低质量',
      prompt_extend: true,
      ...(size ? { size } : {}),
    },
  };

  const requestConfig = {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: timeoutMs,
  };

  try {
    const response = await axios.post(apiUrl, payload, requestConfig);
    const data = response.data;

    if (data?.code) {
      throw new ProviderError(`DashScope error: ${data.code}`, {
        statusCode: 502,
        payload: { error: `DashScope error: ${data.code}`, message: data.message, inputImageUrls: uploadedUrls },
      });
    }

    const outputImageUrls = extractOutputImageUrls(data);
    return { outputImageUrls, raw: data };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    if (err?.response) {
      throw new ProviderError(`DashScope HTTP ${err.response.status}`, {
        statusCode: 502,
        payload: { error: `DashScope HTTP ${err.response.status}`, details: err.response.data, inputImageUrls: uploadedUrls },
        cause: err,
      });
    }
    throw new ProviderError(`DashScope request failed: ${err?.message || String(err)}`, {
      statusCode: 502,
      payload: { error: `DashScope request failed: ${err?.message || String(err)}`, inputImageUrls: uploadedUrls },
      cause: err,
    });
  }
}

module.exports = { id: 'dashscope', generate };
