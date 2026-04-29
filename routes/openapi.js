const { sendJson, readBody } = require('../lib/http');
const { getApiKeyUser } = require('../services/auth');
const { runGenerate, validateRequest } = require('./generate');

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

module.exports = { generate };
