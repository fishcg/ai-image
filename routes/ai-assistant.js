/**
 * AI 辅助功能 API 路由
 * 提供 Prompt 增强和图片风格识别服务
 */

const { readBody } = require('../lib/http');
const { enhancePrompt, extractImageStyle, recognizeScene } = require('../services/ai-assistant');

/**
 * POST /api/ai/enhance-prompt
 * Prompt 增强接口
 *
 * Body:
 * {
 *   "userInput": "用户输入的简单描述",
 *   "mode": "txt2img" | "img2img" (可选，默认 txt2img)
 * }
 *
 * Response:
 * {
 *   "enhancedPrompt": "增强后的详细 prompt",
 *   "tags": ["标签1", "标签2", ...]
 * }
 */
async function handleEnhancePrompt({ body, res, ai }) {
  try {
    const { userInput, mode = 'txt2img' } = body;

    // 参数验证
    if (!userInput || typeof userInput !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '缺少 userInput 参数或格式错误' }));
      return;
    }

    if (userInput.trim().length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'userInput 不能为空' }));
      return;
    }

    if (userInput.length > 500) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'userInput 不能超过 500 字符' }));
      return;
    }

    if (mode !== 'txt2img' && mode !== 'img2img') {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'mode 参数必须是 txt2img 或 img2img' }));
      return;
    }

    // 调用 AI 服务
    const result = await enhancePrompt({
      userInput,
      mode,
      apiKey: ai.API_KEY || ai.apiKey
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error('Enhance prompt error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error.message || 'Prompt 增强失败' }));
  }
}

/**
 * POST /api/ai/extract-style
 * 图片风格提取接口
 *
 * Body:
 * {
 *   "imageUrl": "图片 URL"
 * }
 *
 * Response:
 * {
 *   "styleDescription": "完整的风格描述",
 *   "keywords": ["关键词1", "关键词2", ...],
 *   "suggestedPrompt": "可直接用于生成的 prompt"
 * }
 */
async function handleExtractStyle({ body, res, ai }) {
  try {
    const { imageUrl } = body;

    // 参数验证
    if (!imageUrl || typeof imageUrl !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '缺少 imageUrl 参数或格式错误' }));
      return;
    }

    // 简单的 URL 格式验证
    try {
      new URL(imageUrl);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'imageUrl 格式不正确' }));
      return;
    }

    // 调用 AI 服务
    const result = await extractImageStyle({
      imageUrl,
      apiKey: ai.API_KEY || ai.apiKey
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error('Extract style error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error.message || '风格提取失败' }));
  }
}

/**
 * POST /api/ai/recognize-scene
 * 场景识别接口
 *
 * Body:
 * {
 *   "imageUrl": "图片 URL"
 * }
 *
 * Response:
 * {
 *   "scene": "场景类型",
 *   "objects": ["物体1", "物体2", ...],
 *   "description": "详细描述"
 * }
 */
async function handleRecognizeScene({ body, res, ai }) {
  try {
    const { imageUrl } = body;

    // 参数验证
    if (!imageUrl || typeof imageUrl !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '缺少 imageUrl 参数或格式错误' }));
      return;
    }

    // 简单的 URL 格式验证
    try {
      new URL(imageUrl);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'imageUrl 格式不正确' }));
      return;
    }

    // 调用 AI 服务
    const result = await recognizeScene({
      imageUrl,
      apiKey: ai.API_KEY || ai.apiKey
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error('Recognize scene error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error.message || '场景识别失败' }));
  }
}

/**
 * AI 辅助路由处理器
 */
async function handler({ req, res, ai }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 读取请求体
  let body = {};
  try {
    const bodyBuffer = await readBody(req, { maxBytes: 10 * 1024 * 1024 }); // 10MB for base64 images
    body = JSON.parse(bodyBuffer.toString('utf8'));
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: '请求体格式错误' }));
    return true;
  }

  // POST /api/ai/enhance-prompt
  if (pathname === '/api/ai/enhance-prompt' && req.method === 'POST') {
    return await handleEnhancePrompt({ body, res, ai });
  }

  // POST /api/ai/extract-style
  if (pathname === '/api/ai/extract-style' && req.method === 'POST') {
    return await handleExtractStyle({ body, res, ai });
  }

  // POST /api/ai/recognize-scene
  if (pathname === '/api/ai/recognize-scene' && req.method === 'POST') {
    return await handleRecognizeScene({ body, res, ai });
  }

  return false; // 未匹配的路由
}

module.exports = { handler };
