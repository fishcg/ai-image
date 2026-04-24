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
  if (urls.length === 0) {
    throw new ProviderError('No image URLs in response', { statusCode: 500, payload: { raw: data } });
  }
  return { outputImageUrls: urls, raw: data };
}

async function generate({ axios, gptimage, env, mode, prompt, n, hd, aspectRatio, uploadedUrls, baseDim, timeoutMs }) {
  const apiKey = env.GPTIMAGE_API_KEY || gptimage?.apiKey;
  if (!apiKey) {
    throw new ProviderError('Missing API Key', { statusCode: 500, payload: { error: 'Missing gpt-image API Key' } });
  }

  const baseUrl = (env.GPTIMAGE_API_URL || gptimage?.apiUrl || 'https://image.glmbigmodel.me/v1/images')
    .replace(/\/(generations|edits)$/, '');
  const model = env.GPTIMAGE_MODEL || gptimage?.model || 'gpt-image-2';
  const ratio = normalizeRatio(aspectRatio) || pickClosestRatio(baseDim) || '1:1';
  const size = ratioToSize(ratio);
  const quality = hd ? 'high' : undefined;
  const isEdit = mode === 'img2img' && uploadedUrls && uploadedUrls.length > 0;
  const timeout = timeoutMs || 300000;

  try {
    let response;

    if (isEdit) {
      // edits 端点必须用 multipart/form-data，字段名 image（可多个）
      // 先下载所有图片，再作为文件上传
      const buffers = [];
      for (const url of uploadedUrls) {
        const dl = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
        buffers.push(Buffer.from(dl.data));
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
      // generations 端点用 JSON
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

  } catch (err) {
    if (err instanceof ProviderError) throw err;
    const status = err?.response?.status || 502;
    throw new ProviderError(`Request Failed: ${err.message}`, {
      statusCode: status,
      payload: { error: err.message, details: err?.response?.data },
      cause: err,
    });
  }
}

module.exports = { id: 'gpt-image', generate };