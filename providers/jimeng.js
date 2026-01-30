const crypto = require('crypto');
const { ProviderError } = require('./errors');

/**
 * 火山引擎 API 签名工具
 * 参考：https://www.volcengine.com/docs/6369/67269
 */
class VolcEngineAuth {
  constructor(accessKeyId, secretAccessKey) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = 'cn-north-1';
    this.service = 'cv';
  }

  /**
   * 生成签名
   */
  sign(method, url, headers, body) {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname;
    const path = parsedUrl.pathname;
    const queryString = parsedUrl.search.slice(1);

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    // 构建规范请求
    const canonicalHeaders = `host:${host}\nx-date:${amzDate}\n`;
    const signedHeaders = 'host;x-date';

    const payloadHash = crypto.createHash('sha256').update(body || '').digest('hex');

    const canonicalRequest = [
      method,
      path,
      queryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    // 构建待签名字符串
    const algorithm = 'HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.region}/${this.service}/request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    // 计算签名
    const kDate = crypto.createHmac('sha256', this.secretAccessKey).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(this.service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    // 构建授权头
    const authorizationHeader = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      Authorization: authorizationHeader,
      'X-Date': amzDate,
    };
  }
}

/**
 * 构建宽高比对应的尺寸
 */
function sizeFromAspectRatio(aspectRatio, hd) {
  const r = String(aspectRatio || '1:1').trim();
  const base = hd ? 4096 : 2048;

  const presets = {
    '1:1': { width: base, height: base },
    '4:3': { width: Math.round((base * 4) / 3), height: base },
    '3:4': { width: base, height: Math.round((base * 4) / 3) },
    '16:9': { width: Math.round((base * 16) / 9), height: base },
    '9:16': { width: base, height: Math.round((base * 16) / 9) },
  };

  return presets[r] || presets['1:1'];
}

/**
 * 提交即梦任务
 */
async function submitTask({ axios, auth, prompt, imageUrls = [], scale = 0.5, width, height, size, forceSingle = true, timeoutMs }) {
  const apiUrl = 'https://visual.volcengineapi.com?Action=CVSync2AsyncSubmitTask&Version=2022-08-31';

  const body = JSON.stringify({
    req_key: 'jimeng_t2i_v40',
    prompt,
    ...(imageUrls.length > 0 ? { image_urls: imageUrls } : {}),
    ...(width && height ? { width, height } : {}),
    ...(size ? { size } : {}),
    scale,
    force_single: forceSingle,
  });

  const signHeaders = auth.sign('POST', apiUrl, {}, body);

  try {
    const response = await axios.post(apiUrl, body, {
      headers: {
        ...signHeaders,
        'Content-Type': 'application/json',
      },
      timeout: timeoutMs,
    });

    const data = response.data;

    if (data.code !== 10000) {
      throw new ProviderError(`JiMeng submit error: ${data.code}`, {
        statusCode: 502,
        payload: { error: `JiMeng submit error: ${data.code}`, message: data.message },
      });
    }

    return data.data.task_id;
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    if (err?.response) {
      throw new ProviderError(`JiMeng HTTP ${err.response.status}`, {
        statusCode: 502,
        payload: { error: `JiMeng HTTP ${err.response.status}`, details: err.response.data },
        cause: err,
      });
    }
    throw new ProviderError(`JiMeng request failed: ${err?.message || String(err)}`, {
      statusCode: 502,
      payload: { error: `JiMeng request failed: ${err?.message || String(err)}` },
      cause: err,
    });
  }
}

/**
 * 查询即梦任务结果
 */
async function getTaskResult({ axios, auth, taskId, returnUrl = true, timeoutMs, maxRetries = 30, retryInterval = 2000 }) {
  const apiUrl = 'https://visual.volcengineapi.com?Action=CVSync2AsyncGetResult&Version=2022-08-31';

  const reqJson = JSON.stringify({
    return_url: returnUrl,
  });

  const body = JSON.stringify({
    req_key: 'jimeng_t2i_v40',
    task_id: taskId,
    req_json: reqJson,
  });

  const signHeaders = auth.sign('POST', apiUrl, {}, body);

  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await axios.post(apiUrl, body, {
        headers: {
          ...signHeaders,
          'Content-Type': 'application/json',
        },
        timeout: timeoutMs,
      });

      const data = response.data;

      if (data.code !== 10000) {
        throw new ProviderError(`JiMeng query error: ${data.code}`, {
          statusCode: 502,
          payload: { error: `JiMeng query error: ${data.code}`, message: data.message },
        });
      }

      const status = data.data?.status;

      if (status === 'done') {
        const imageUrls = data.data?.image_urls || [];
        return { outputImageUrls: imageUrls, raw: data };
      }

      if (status === 'not_found' || status === 'expired') {
        throw new ProviderError(`JiMeng task ${status}`, {
          statusCode: 502,
          payload: { error: `JiMeng task ${status}` },
        });
      }

      // 任务还在处理中，等待后重试
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
      retries++;
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err?.response) {
        throw new ProviderError(`JiMeng HTTP ${err.response.status}`, {
          statusCode: 502,
          payload: { error: `JiMeng HTTP ${err.response.status}`, details: err.response.data },
          cause: err,
        });
      }
      throw new ProviderError(`JiMeng request failed: ${err?.message || String(err)}`, {
        statusCode: 502,
        payload: { error: `JiMeng request failed: ${err?.message || String(err)}` },
        cause: err,
      });
    }
  }

  throw new ProviderError('JiMeng task timeout', {
    statusCode: 504,
    payload: { error: 'JiMeng task timeout' },
  });
}

/**
 * 即梦生成接口
 */
async function generate({ axios, jimeng, env, mode, prompt, n, hd, aspectRatio, uploadedUrls, timeoutMs }) {
  const accessKeyId = env.JIMENG_ACCESS_KEY_ID || jimeng?.ACCESS_KEY_ID;
  const secretAccessKey = env.JIMENG_SECRET_ACCESS_KEY || jimeng?.SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new ProviderError('Missing JiMeng credentials', {
      statusCode: 500,
      payload: { error: 'Missing JIMENG_ACCESS_KEY_ID or JIMENG_SECRET_ACCESS_KEY. Please configure in config.js' },
    });
  }

  const auth = new VolcEngineAuth(accessKeyId, secretAccessKey);
  const isTxt2Img = String(mode || 'img2img') === 'txt2img';

  // 构建尺寸参数
  let size, width, height;
  if (isTxt2Img) {
    const dims = sizeFromAspectRatio(aspectRatio, hd);
    width = dims.width;
    height = dims.height;
  } else {
    // 图生图使用默认 2K 分辨率
    size = hd ? 4096 * 4096 : 2048 * 2048;
  }

  // 增强 prompt 以控制生成数量
  // 即梦 API 会根据 prompt 判断生成数量，因此在 prompt 中明确说明
  let enhancedPrompt = prompt;
  if (n > 1) {
    enhancedPrompt = `生成${n}张图片。${prompt}`;
  }

  // 提交任务
  const taskId = await submitTask({
    axios,
    auth,
    prompt: enhancedPrompt,
    imageUrls: uploadedUrls,
    scale: isTxt2Img ? 0.5 : 0.5,
    width,
    height,
    size,
    forceSingle: n === 1,
    timeoutMs,
  });

  // 查询结果
  const result = await getTaskResult({
    axios,
    auth,
    taskId,
    returnUrl: true,
    timeoutMs,
    maxRetries: 30,
    retryInterval: 2000,
  });

  return result;
}

module.exports = { id: 'jimeng', generate };