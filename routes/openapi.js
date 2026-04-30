const { sendJson, readBody } = require('../lib/http');
const { getApiKeyUser } = require('../services/auth');
const { runGenerate, validateRequest } = require('./generate');
const { extractImageStyle, recognizeScene } = require('../services/ai-assistant');

async function generate(deps) {
  const { req, res, pool } = deps;

  let user;
  try {
    user = await getApiKeyUser({ pool, req });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!user) {
    sendJson(res, 401, { error: 'Invalid or missing API key. Use header: Authorization: Bearer ak_xxx' });
    return;
  }
  if (user.is_disabled) {
    sendJson(res, 403, { error: 'Account is disabled' });
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

  const result = await runGenerate({ ...deps, user, parsed });

  const payload = { success: result.statusCode === 200 };
  if (result.statusCode === 200) {
    payload.images = result.payload.outputImageUrls || [];
    payload.quota = result.payload.quota || null;
  } else {
    payload.error = result.payload.error || 'Generation failed';
    if (result.payload.quota) payload.quota = result.payload.quota;
  }

  sendJson(res, result.statusCode, payload);
}

async function understand(deps) {
  const { req, res, pool, ai } = deps;

  let user;
  try {
    user = await getApiKeyUser({ pool, req });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!user) {
    sendJson(res, 401, { error: 'Invalid or missing API key. Use header: Authorization: Bearer ak_xxx' });
    return;
  }
  if (user.is_disabled) {
    sendJson(res, 403, { error: 'Account is disabled' });
    return;
  }

  let body;
  try {
    body = await readBody(req, { maxBytes: 10 * 1024 * 1024 });
  } catch (err) {
    if (err?.code === 'PAYLOAD_TOO_LARGE') {
      sendJson(res, 413, { error: 'Payload too large (max 10MB)' });
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

  const { action, imageUrl } = parsed;

  if (!action || !['extract-style', 'recognize-scene'].includes(action)) {
    sendJson(res, 400, { error: 'action is required, must be "extract-style" or "recognize-scene"' });
    return;
  }
  if (!imageUrl || typeof imageUrl !== 'string') {
    sendJson(res, 400, { error: 'imageUrl is required' });
    return;
  }
  try {
    new URL(imageUrl);
  } catch {
    sendJson(res, 400, { error: 'imageUrl is not a valid URL' });
    return;
  }

  const apiKey = ai.API_KEY || ai.apiKey;

  try {
    let result;
    if (action === 'extract-style') {
      result = await extractImageStyle({ imageUrl, apiKey });
    } else {
      result = await recognizeScene({ imageUrl, apiKey });
    }
    sendJson(res, 200, { success: true, action, ...result });
  } catch (err) {
    console.error('OpenAPI understand error:', err);
    sendJson(res, 502, { success: false, error: err.message || 'Image understanding failed' });
  }
}

module.exports = { generate, understand };
