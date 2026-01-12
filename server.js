const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { UploadFile } = require('./lib/OSS');
const { http: httpConfig, dc, ai } = require('./config');

const PORT = Number(process.env.PORT || httpConfig?.port || 7992);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

function guessContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

function safeJoinPublic(relPath) {
  const publicDir = path.join(__dirname, 'public');
  const normalized = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(publicDir, normalized);
}

function readBody(req, { maxBytes }) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(Object.assign(new Error('Payload too large'), { code: 'PAYLOAD_TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

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

function extractOutputImageUrls(dashscopeResponse) {
  const content = dashscopeResponse?.output?.choices?.[0]?.message?.content;
  if (!Array.isArray(content)) return [];
  return content.filter((x) => x && typeof x.image === 'string').map((x) => x.image);
}

async function handleGenerate(req, res) {
  const apiKey = process.env.DASHSCOPE_API_KEY || ai?.API_KEY;
  const apiUrl = process.env.DASHSCOPE_URL || ai?.URL;
  const model = process.env.DASHSCOPE_MODEL || ai?.MODEL || 'qwen-image-edit-plus';

  if (!apiKey) {
    sendJson(res, 500, { error: 'Missing DASHSCOPE_API_KEY' });
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

  const prompt = String(parsed?.prompt || '').trim();
  const nRaw = Number(parsed?.n);
  const n = Number.isFinite(nRaw) ? Math.max(1, Math.min(6, Math.floor(nRaw))) : 2;
  const images = Array.isArray(parsed?.images) ? parsed.images : [];

  if (!prompt) {
    sendJson(res, 400, { error: 'Prompt is required' });
    return;
  }
  if (images.length === 0) {
    sendJson(res, 400, { error: 'At least 1 image is required' });
    return;
  }
  if (images.length > 6) {
    sendJson(res, 400, { error: 'At most 6 input images are allowed' });
    return;
  }

  const uploadedUrls = [];
  try {
    for (const item of images) {
      const filename = String(item?.name || 'image');
      const { mime, buffer } = parseDataUrl(item?.dataUrl);
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
    sendJson(res, 500, { error: `OSS upload failed: ${err?.message || String(err)}` });
    return;
  }

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
    },
  };

  const timeoutMs = Number(process.env.DASHSCOPE_TIMEOUT || ai?.TIMEOUT || 120000);
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
      sendJson(res, 502, { error: `DashScope error: ${data.code}`, message: data.message, inputImageUrls: uploadedUrls });
      return;
    }

    const outputImageUrls = extractOutputImageUrls(data);
    sendJson(res, 200, { inputImageUrls: uploadedUrls, outputImageUrls, raw: data });
  } catch (err) {
    if (err?.response) {
      sendJson(res, 502, { error: `DashScope HTTP ${err.response.status}`, details: err.response.data, inputImageUrls: uploadedUrls });
      return;
    }
    sendJson(res, 502, { error: `DashScope request failed: ${err?.message || String(err)}`, inputImageUrls: uploadedUrls });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && url.pathname === '/api/generate') {
    await handleGenerate(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method Not Allowed');
    return;
  }

  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = safeJoinPublic(pathname);

  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      sendText(res, 404, 'Not Found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': guessContentType(filePath),
      'Cache-Control': 'no-store',
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Web UI running: http://localhost:${PORT}`);
});

