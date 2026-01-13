const { ProviderError } = require('./errors');
const { buildAspectRatio } = require('../lib/image');
const { UploadFile } = require('../lib/OSS.js');

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

// 提取 Gemini 格式响应中的图片
// 响应可能是 Base64 (inlineData) 或 URL (text)
async function extractGeminiImages(data) {
  const urls = [];

  if (data?.candidates && Array.isArray(data.candidates)) {
    for (const candidate of data.candidates) {
      if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
        for (const part of candidate.content.parts) {
          // 1. 检查 Base64 图片
          if (part.inlineData && part.inlineData.data) {
            const base64Data = part.inlineData.data;
            const buffer = Buffer.from(base64Data, 'base64');
            const mimeType = part.inlineData.mime_type || 'image/jpeg';
            const extension = mimeType.split('/')[1] || 'jpg';
            const targetObjectKey = `images/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
            const url = await UploadFile(targetObjectKey, buffer, { mime: mimeType });
            urls.push(url);
          }
          // 2. 检查 Text 中的 URL (NewAPI 经常在 text 里直接返回链接)
          else if (part.text && /^https?:\/\//.test(part.text)) {
            urls.push(part.text);
          }
        }
      }
    }
  }

  // 备用：检查是否有直接的 url 字段 (NewAPI 特有情况)
  if (data?.url) urls.push(data.url);
  if (data?.data && Array.isArray(data.data)) {
    data.data.forEach(item => {
      if (item.url) urls.push(item.url);
    });
  }

  return urls;
}

async function generate({ axios, nanoai, env, prompt, n, hd, uploadedUrls, baseDim, timeoutMs }) {
  // 1. 获取 API Key (支持多种环境变量命名)
  const apiKey = nanoai?.apiKey;

  if (!apiKey) {
    throw new ProviderError('Missing API Key', { statusCode: 500, payload: { error: 'Missing API Key' } });
  }
  const apiUrl = nanoai.apiUrl;
  // 3. 准备参数
  const aspect_ratio = pickClosestAspectRatio(baseDim);
  // 简单的分辨率映射，HD 对应较高分辨率，普通对应较低
  // 注意：imageSize 具体支持的值取决于 newapi 文档，这里假设支持 standard/hd 或 1024x1024 格式
  // 如果报错，可以尝试改为 "1024x1024" 或 null
  const image_size = hd ? "1024x1024" : "512x512";

  // 4. 构建 Payload (严格按照你提供的 fetch body 结构)
  const payload = {
    contents: [
      {
        parts: [
          { text: prompt } // 将提示词放入 parts
        ]
      }
    ],
    generationConfig: {
      responseModalities: [
        "IMAGE" // 通常图生图或文生图这里是 IMAGE
      ],
      imageConfig: {
        aspectRatio: aspect_ratio,
        imageSize: image_size
      }
    }
  };

  const requestConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}` // Bearer 认证
    },
    timeout: timeoutMs,
  };

  try {
    // 5. 发起请求
    const response = await axios.post(apiUrl, payload, requestConfig);
    const data = response.data;

    // 6. 错误处理
    if (data.error) {
      throw new ProviderError(`API Error: ${data.error.message}`, {
        statusCode: data.error.code || 500,
        payload: { error: data.error.message, details: data.error },
      });
    }

    // 7. 提取结果
    const outputImageUrls = await extractGeminiImages(data);

    if (outputImageUrls.length === 0) {
      // 如果没有提取到图片，尝试打印原始数据以便调试
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