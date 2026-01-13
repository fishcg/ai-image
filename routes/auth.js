const crypto = require('crypto');
const {
  normalizeUsername,
  validateUsername,
  validatePassword,
  pbkdf2HashPassword,
  pbkdf2VerifyPassword,
  sha256Hex,
  validateInviteCode,
  getAuthUser,
} = require('../services/auth');
const { getMonthKey, getQuota } = require('../services/quota');
const { readBody, sendJson, setCookie, clearCookie } = require('../lib/http');

async function register({ req, res, pool, passwordMinLen, registrationCodes }) {
  let body;
  try {
    body = await readBody(req, { maxBytes: 32 * 1024 });
  } catch {
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

  const username = normalizeUsername(parsed?.username);
  const password = String(parsed?.password || '');
  const inviteCode = parsed?.inviteCode;
  const uErr = validateUsername(username);
  if (uErr) return sendJson(res, 400, { error: uErr });
  const pErr = validatePassword(password, { minLen: passwordMinLen });
  if (pErr) return sendJson(res, 400, { error: pErr });
  const iErr = validateInviteCode(inviteCode, { registrationCodes });
  if (iErr) return sendJson(res, registrationCodes.length ? 400 : 500, { error: iErr });

  const passwordHash = pbkdf2HashPassword(password);
  try {
    await pool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
  } catch (err) {
    if (String(err?.code) === 'ER_DUP_ENTRY') {
      sendJson(res, 409, { error: '用户名已存在' });
      return;
    }
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  sendJson(res, 200, { ok: true });
}

async function login({ req, res, pool, sessionTtlDays, monthlyLimit }) {
  let body;
  try {
    body = await readBody(req, { maxBytes: 32 * 1024 });
  } catch {
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

  const username = normalizeUsername(parsed?.username);
  const password = String(parsed?.password || '');
  if (!username || !password) {
    sendJson(res, 400, { error: '用户名和密码不能为空' });
    return;
  }

  const [rows] = await pool.query('SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1', [username]);
  const user = rows?.[0];
  if (!user || !pbkdf2VerifyPassword(password, user.password_hash)) {
    sendJson(res, 401, { error: '用户名或密码错误' });
    return;
  }

  const sid = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256Hex(sid);
  const ttlSeconds = Math.max(60, sessionTtlDays * 24 * 3600);
  await pool.query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))', [
    user.id,
    tokenHash,
    ttlSeconds,
  ]);

  setCookie(res, 'sid', sid, { maxAge: ttlSeconds });
  const quota = await getQuota({ pool, userId: user.id, month: getMonthKey(new Date()), monthlyLimit });
  sendJson(res, 200, { ok: true, user: { id: user.id, username: user.username }, quota });
}

async function logout({ req, res, pool }) {
  const header = String(req.headers.cookie || '');
  const match = /(?:^|;\s*)sid=([^;]+)/.exec(header);
  const sid = match ? decodeURIComponent(match[1]) : '';
  clearCookie(res, 'sid');
  if (!sid) {
    sendJson(res, 200, { ok: true });
    return;
  }
  await pool.query('DELETE FROM sessions WHERE token_hash = ? LIMIT 1', [sha256Hex(sid)]).catch(() => {});
  sendJson(res, 200, { ok: true });
}

async function me({ req, res, pool, monthlyLimit }) {
  let user;
  try {
    user = await getAuthUser({ pool, req });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!user) {
    sendJson(res, 200, { user: null, quota: null });
    return;
  }
  const quota = await getQuota({ pool, userId: user.id, month: getMonthKey(new Date()), monthlyLimit });
  sendJson(res, 200, { user: { id: user.id, username: user.username }, quota });
}

module.exports = { register, login, logout, me, getAuthUser };

