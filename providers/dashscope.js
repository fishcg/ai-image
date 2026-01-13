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
  const content = dashscopeResponse?.output?.choices?.[0]?.message?.content;
  if (!Array.isArray(content)) return [];
  return content.filter((x) => x && typeof x.image === 'string').map((x) => x.image);
}

async function generate({ axios, ai, env, prompt, n, hd, uploadedUrls, baseDim, timeoutMs }) {
  const apiKey = env.DASHSCOPE_API_KEY || ai?.API_KEY;
  const apiUrl = env.DASHSCOPE_URL || ai?.URL;
  const model = env.DASHSCOPE_MODEL || ai?.MODEL || 'qwen-image-edit-plus';

  if (!apiKey) {
    throw new ProviderError('Missing DASHSCOPE_API_KEY', { statusCode: 500, payload: { error: 'Missing DASHSCOPE_API_KEY' } });
  }

  const size = baseDim ? buildDashScopeSize(baseDim, { maxSide: 2048, multiple: 64, forceMaxSide: hd }) : (hd ? '2048*2048' : null);

  const payload = {
    model,
    input: {
      messages: [
        {
          role: 'user',
          content: [...uploadedUrls.map((url) => ({ image: url })), { text: prompt }],
        },
      ],
    },
    parameters: {
      n,
      watermark: false,
      negative_prompt: '低质量',
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
