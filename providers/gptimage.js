const FormData = require('form-data');
const { ProviderError } = require('./errors');
const { buildAspectRatio } = require('../lib/image');

const ALLOWED_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16'];

// gpt-image-2 支持任意分辨率，需满足：最大边 ≤ 3840，两边均为 16 倍数，长宽比 ≤ 3:1，总像素 655360~8294400
// 以下为各比例在 2K（长边 2048）下的尺寸
const RATIO_SIZE_MAP = {
  '1:1': '2048x2048',
  '4:3': '2048x1536',
  '3:4': '1536x2048',
  '16:9': '2048x1152',
  '9:16': '1152x2048',
};

function normalizeRatio(r) {
  const s = String(r || '').trim();
  return ALLOWED_RATIOS.includes(s) ? s : null;
}

function ratioToSize(ratio) {
  return RATIO_SIZE_MAP[ratio] || '2048x2048';
}

function pickClosestRatio(dim) {
  const raw = buildAspectRatio(dim);
  if (!raw) return '1:1';
  if (ALLOWED_RATIOS.includes(raw)) return raw;
  const [a, b] = raw.split(':').map(Number);
  const rawVal = a / b;
  let best = '1:1', bestDiff = Infinity;
  for (const c of ALLOWED_RATIOS) {
    const [x, y] = c.split(':').map(Number);
    const diff = Math.abs(rawVal - x / y);
    if (diff < bestDiff) { bestDiff = diff; best = c; }
  }
  return best;
}

function extractUrls(data) {
  const items = Array.isArray(data?.data) ? data.data : [];
  if (items.length === 0) {
    throw new ProviderError('No images returned', { statusCode: 500, payload: { raw: data } });
  }
  const urls = items.map(i => i.url).filter(Boolean);
  const base64Buffers = items
    .map(i => i.b64_json)
    .filter(Boolean)
    .map(value => Buffer.from(value, 'base64'))
    .filter(buffer => buffer.length > 0);
  if (urls.length === 0 && base64Buffers.length === 0) {
    throw new ProviderError('No image data in response', { statusCode: 500, payload: { raw: data } });
  }
  return { outputImageUrls: urls, base64Buffers, raw: data };
}

function normalizeFallbackBaseUrl(apiUrl) {
  return String(apiUrl || 'https://cf.api.fan')
    .replace(/\/+$/, '')
    .replace(/\/v1\/images(?:\/(?:generations|edits))?$/, '');
}

async function generatePacky({ axios, gptimage, env, mode, prompt, size, quality, uploadedUrls, timeout }) {
  const fb = gptimage?.fallback || {};
  const apiKey = env.PACKY_API_KEY || env.GPTIMAGE_FALLBACK_API_KEY || fb.apiKey;
  if (!apiKey) {
    throw new ProviderError('Missing Packy API Key', {
      statusCode: 500,
      payload: { error: 'Missing Packy API Key' },
    });
  }

  const baseUrl = normalizeFallbackBaseUrl(
    env.PACKY_API_URL || env.GPTIMAGE_FALLBACK_API_URL || fb.apiUrl
  );
  const model = env.PACKY_MODEL || env.GPTIMAGE_FALLBACK_MODEL || fb.model || 'gpt-image-2';
  const headers = {
    Accept: '*/*',
    Authorization: `Bearer ${apiKey}`,
  };
  const reqTimeout = Number(env.PACKY_TIMEOUT || env.GPTIMAGE_FALLBACK_TIMEOUT || fb.timeout || timeout || 300000);
  const isEdit = mode === 'img2img' && Array.isArray(uploadedUrls) && uploadedUrls.length > 0;

  let response;
  if (isEdit) {
    // Packy 的 edits 接口建议一次只传一张图；路由会把基准图放在最后。
    const inputUrl = uploadedUrls[uploadedUrls.length - 1];
    const imageResponse = await axios.get(inputUrl, {
      responseType: 'arraybuffer',
      timeout: Math.min(reqTimeout, 60000),
    });
    const contentType = imageResponse.headers?.['content-type'] || 'image/png';
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('image', Buffer.from(imageResponse.data), {
      filename: 'image.png',
      contentType,
    });
    form.append('size', size);
    form.append('quality', quality || 'auto');
    form.append('output_format', 'png');
    form.append('response_format', 'url');
    form.append('input_fidelity', 'high');
    form.append('n', '1');

    response = await axios.post(`${baseUrl}/v1/images/edits`, form, {
      headers: { ...headers, ...form.getHeaders() },
      timeout: reqTimeout,
      maxContentLength: 100 * 1024 * 1024,
      maxBodyLength: 100 * 1024 * 1024,
    });
  } else {
    response = await axios.post(`${baseUrl}/v1/images/generations`, {
      model,
      prompt,
      size,
      quality: quality || 'auto',
      output_format: 'png',
      response_format: 'url',
      n: 1,
    }, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      timeout: reqTimeout,
      maxContentLength: 100 * 1024 * 1024,
      maxBodyLength: 100 * 1024 * 1024,
    });
  }

  return extractUrls(response.data);
}

async function generateOriginal({ axios, gptimage, env, mode, prompt, n, quality, size, uploadedUrls, timeout }) {
  const apiKey = env.GPTIMAGE_API_KEY || gptimage?.apiKey;
  if (!apiKey) {
    throw new ProviderError('Missing gpt-image API Key', {
      statusCode: 500,
      payload: { error: 'Missing gpt-image API Key' },
    });
  }

  const baseUrl = (env.GPTIMAGE_API_URL || gptimage?.apiUrl || 'https://image.glmbigmodel.me/v1/images')
    .replace(/\/(generations|edits)$/, '');
  const model = env.GPTIMAGE_MODEL || gptimage?.model || 'gpt-image-2';
  const isEdit = mode === 'img2img' && uploadedUrls && uploadedUrls.length > 0;

  let response;
  if (isEdit) {
    const buffers = [];
    for (const url of uploadedUrls) {
      const download = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
      buffers.push(Buffer.from(download.data));
    }

    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', size);
    if (quality) form.append('quality', quality);
    form.append('response_format', 'url');
    for (let i = 0; i < buffers.length; i++) {
      form.append('image', buffers[i], { filename: `image_${i}.png`, contentType: 'image/png' });
    }

    response = await axios.post(`${baseUrl}/edits`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${apiKey}` },
      timeout,
      maxContentLength: 100 * 1024 * 1024,
      maxBodyLength: 100 * 1024 * 1024,
    });
  } else {
    const body = {
      model,
      prompt,
      size,
      n: Math.max(1, Math.min(4, n || 1)),
      response_format: 'url',
    };
    if (quality) body.quality = quality;

    response = await axios.post(`${baseUrl}/generations`, body, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      timeout,
      maxContentLength: 100 * 1024 * 1024,
      maxBodyLength: 100 * 1024 * 1024,
    });
  }

  return extractUrls(response.data);
}

function normalizeProviderError(error, providerName) {
  if (error instanceof ProviderError) return error;
  const statusCode = error?.response?.status || 502;
  return new ProviderError(`${providerName} request failed: ${error.message}`, {
    statusCode,
    payload: { error: error.message, details: error?.response?.data },
    cause: error,
  });
}

async function generate({
  axios,
  gptimage,
  env,
  mode,
  prompt,
  negativePrompt,
  n,
  hd,
  aspectRatio,
  uploadedUrls,
  baseDim,
  timeoutMs,
  gptImagePrimaryProvider,
}) {
  const ratio = normalizeRatio(aspectRatio) || pickClosestRatio(baseDim) || '1:1';
  const size = ratioToSize(ratio);
  const quality = hd ? 'high' : undefined;
  const timeout = timeoutMs || 300000;
  const finalPrompt = negativePrompt
    ? `${prompt}\n\n不要出现：${negativePrompt}`
    : prompt;
  const primaryProvider = gptImagePrimaryProvider === 'packy' ? 'packy' : 'original';
  const fallbackProvider = primaryProvider === 'packy' ? 'original' : 'packy';
  const providerLabels = { original: '原供应商', packy: 'Packy' };
  const runners = {
    original: () => generateOriginal({
      axios,
      gptimage,
      env,
      mode,
      prompt: finalPrompt,
      n,
      quality,
      size,
      uploadedUrls,
      timeout,
    }),
    packy: () => generatePacky({
      axios,
      gptimage,
      env,
      mode,
      prompt: finalPrompt,
      size,
      quality: hd ? 'high' : 'auto',
      uploadedUrls,
      timeout,
    }),
  };

  try {
    return await runners[primaryProvider]();
  } catch (error) {
    const primaryError = normalizeProviderError(error, providerLabels[primaryProvider]);
    console.log(`[gpt-image] ${providerLabels[primaryProvider]}失败(${primaryError.message})，尝试 ${providerLabels[fallbackProvider]} fallback...`);

    try {
      return await runners[fallbackProvider]();
    } catch (fallbackError) {
      const normalizedFallbackError = normalizeProviderError(fallbackError, providerLabels[fallbackProvider]);
      console.log(`[gpt-image] ${providerLabels[fallbackProvider]} fallback 也失败: ${normalizedFallbackError.message}`);
      throw new ProviderError(primaryError.message, {
        statusCode: primaryError.statusCode,
        payload: {
          ...(primaryError.payload || { error: primaryError.message }),
          fallbackError: normalizedFallbackError.message,
        },
        cause: primaryError,
      });
    }
  }
}

module.exports = { id: 'gpt-image', generate };
