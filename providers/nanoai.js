const { ProviderError } = require('./errors');
const { buildAspectRatio } = require('../lib/image');

// 定义支持的宽高比
const ALLOWED_ASPECT_RATIOS = [
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
];

function ratioValue(r) {
  const [a, b] = String(r).split(':').map((x) => Number(x));
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
  return a / b;
}

function pickClosestAspectRatio(dim) {
  const raw = buildAspectRatio(dim);
  if (!raw) return '1:1';
  if (ALLOWED_ASPECT_RATIOS.includes(raw)) return raw;

  const rawVal = ratioValue(raw);
  if (!rawVal) return '1:1';

  let best = '1:1';
  let bestDiff = Infinity;
  for (const candidate of ALLOWED_ASPECT_RATIOS) {
    const v = ratioValue(candidate);
    if (!v) continue;
    const diff = Math.abs(rawVal - v);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }
  return best;
}

async function extractNanoAiDrawImageUrls(data) {
  if (data && data.code === 200 && data.data) {
    const url = data.data.url || data.data.image_url;
    if (url) {
      return [url];
    }
  }
  return [];
}

async function generate({ axios, nanoai, env, prompt, n, hd, uploadedUrls, baseDim, timeoutMs }) {
  // 1. 获取 API Key (支持多种环境变量命名)
  const apiKey = env.NANOAI_API_KEY || nanoai?.apiKey;
  if (!apiKey) {
    throw new ProviderError('Missing API Key', { statusCode: 500, payload: { error: 'Missing API Key' } });
  }

  // 2. 设置 API 地址
  const apiUrl = env.NANOAI_API_URL || nanoai?.apiUrl || 'https://bapi.nanoai.cn/api/v1/images/gemini3pro';

  // 3. 准备 Payload
  const model = env.NANOAI_MODEL || nanoai?.model || 'gemini-3-pro-image-preview';
  // 默认普通画质 1K，高清 2K (或者根据 env 配置)
  const imageSize = hd
    ? (env.NANOAI_IMAGE_SIZE_HD || nanoai?.imageSizeHd || '2K')
    : (env.NANOAI_IMAGE_SIZE || nanoai?.imageSize || '1K');
  
  const aspectRatio = pickClosestAspectRatio(baseDim);

  const payload = {
    model,
    prompt: prompt,
    stream: false,
    image_size: imageSize,
    aspect_ratio: aspectRatio,
    reference_images: uploadedUrls || [],
    response_format: 'url'
  };
  const requestConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}` // Bearer 认证
    },
    timeout: timeoutMs,
  };

  try {
    // 4. 发起请求
    const response = await axios.post(apiUrl, payload, requestConfig);
    const data = response.data;

    // 5. 错误处理
    if (data.code !== 200) {
      throw new ProviderError(`API Error: ${data.message || 'Unknown error'}`, {
        statusCode: data.code || 500,
        payload: { error: data.message, details: data },
      });
    }

    // 6. 提取结果
    const outputImageUrls = await extractNanoAiDrawImageUrls(data);

    if (outputImageUrls.length === 0) {
      throw new ProviderError('No images returned', {
        statusCode: 500,
        payload: { raw: data, sentPayload: payload }
      });
    }

    return { outputImageUrls, raw: data };

  } catch (err) {
    if (err instanceof ProviderError) throw err;

    const status = err?.response?.status || 502;
    const errorData = err?.response?.data;

    throw new ProviderError(`Request Failed: ${err.message}`, {
      statusCode: status,
      payload: {
        error: err.message,
        details: errorData,
        url: apiUrl
      },
      cause: err,
    });
  }
}

module.exports = { id: 'google-nano-banana-pro', generate };