const crypto = require('crypto');
const { sendJson } = require('../lib/http');
const { getAuthUser, sha256Hex } = require('../services/auth');

async function getApiKey({ req, res, pool }) {
  let user;
  try {
    user = await getAuthUser({ pool, req });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!user) { sendJson(res, 401, { error: '请先登录' }); return; }

  const [rows] = await pool.query(
    'SELECT api_key, name, created_at, last_used_at FROM api_keys WHERE user_id = ? LIMIT 1',
    [user.id]
  );
  if (rows.length === 0) {
    sendJson(res, 200, { apiKey: null });
    return;
  }
  sendJson(res, 200, { apiKey: rows[0] });
}

async function createApiKey({ req, res, pool }) {
  let user;
  try {
    user = await getAuthUser({ pool, req });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!user) { sendJson(res, 401, { error: '请先登录' }); return; }

  const [existing] = await pool.query('SELECT id FROM api_keys WHERE user_id = ? LIMIT 1', [user.id]);
  if (existing.length > 0) {
    sendJson(res, 409, { error: '已存在 API Key，请先删除再创建' });
    return;
  }

  const rawKey = 'ak_' + crypto.randomBytes(20).toString('hex');
  const keyHash = sha256Hex(rawKey);
  const keyPrefix = rawKey.slice(0, 8);

  await pool.query(
    'INSERT INTO api_keys (user_id, api_key, api_key_hash, key_prefix) VALUES (?, ?, ?, ?)',
    [user.id, rawKey, keyHash, keyPrefix]
  );

  sendJson(res, 201, { apiKey: rawKey });
}

async function deleteApiKey({ req, res, pool }) {
  let user;
  try {
    user = await getAuthUser({ pool, req });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!user) { sendJson(res, 401, { error: '请先登录' }); return; }

  await pool.query('DELETE FROM api_keys WHERE user_id = ?', [user.id]);
  sendJson(res, 200, { ok: true });
}

module.exports = { getApiKey, createApiKey, deleteApiKey };
