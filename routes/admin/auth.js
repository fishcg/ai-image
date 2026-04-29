const crypto = require('crypto');
const { sendJson } = require('../../lib/http');

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getAdminUser({ pool, req }) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.admin_sid;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const [sessions] = await pool.query(
    `SELECT s.admin_id, a.username, a.role
     FROM admin_sessions s
     JOIN admin_users a ON s.admin_id = a.id
     WHERE s.token_hash = ? AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  if (sessions.length === 0) return null;
  return { id: sessions[0].admin_id, username: sessions[0].username, role: sessions[0].role };
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=');
    cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
}

async function login({ req, res, pool, sessionTtlDays = 7 }) {
  let body;
  try {
    const { readBody } = require('../../lib/http');
    body = await readBody(req, { maxBytes: 1024 * 1024 });
    body = JSON.parse(body.toString('utf8'));
  } catch {
    sendJson(res, 400, { error: 'Invalid request body' });
    return;
  }

  const username = String(body?.username || '').trim();
  const password = String(body?.password || '');

  if (!username || !password) {
    sendJson(res, 400, { error: '用户名和密码不能为空' });
    return;
  }

  const passwordHash = hashPassword(password);

  try {
    const [admins] = await pool.query(
      'SELECT id, username, role FROM admin_users WHERE username = ? AND password_hash = ? LIMIT 1',
      [username, passwordHash]
    );

    if (admins.length === 0) {
      sendJson(res, 401, { error: '用户名或密码错误' });
      return;
    }

    const admin = admins[0];
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + sessionTtlDays * 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO admin_sessions (admin_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [admin.id, tokenHash, expiresAt]
    );

    res.setHeader('Set-Cookie', `admin_sid=${token}; Path=/; HttpOnly; Max-Age=${sessionTtlDays * 86400}; SameSite=Strict`);
    sendJson(res, 200, { username: admin.username, role: admin.role });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function logout({ req, res, pool }) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.admin_sid;

  if (token) {
    const tokenHash = hashToken(token);
    try {
      await pool.query('DELETE FROM admin_sessions WHERE token_hash = ?', [tokenHash]);
    } catch (err) {
      console.error('Failed to delete admin session:', err);
    }
  }

  res.setHeader('Set-Cookie', 'admin_sid=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict');
  sendJson(res, 200, { success: true });
}

async function me({ req, res, pool }) {
  try {
    const admin = await getAdminUser({ pool, req });
    if (!admin) {
      sendJson(res, 401, { error: '未登录' });
      return;
    }
    sendJson(res, 200, { username: admin.username, role: admin.role });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function changePassword({ req, res, pool }) {
  let admin;
  try {
    admin = await getAdminUser({ pool, req });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!admin) {
    sendJson(res, 401, { error: '未登录' });
    return;
  }

  let body;
  try {
    const { readBody } = require('../../lib/http');
    body = await readBody(req, { maxBytes: 1024 * 1024 });
    body = JSON.parse(body.toString('utf8'));
  } catch {
    sendJson(res, 400, { error: 'Invalid request body' });
    return;
  }

  const oldPassword = String(body?.oldPassword || '');
  const newPassword = String(body?.newPassword || '');

  if (!oldPassword || !newPassword) {
    sendJson(res, 400, { error: '旧密码和新密码不能为空' });
    return;
  }
  if (newPassword.length < 6) {
    sendJson(res, 400, { error: '新密码长度至少 6 位' });
    return;
  }

  try {
    const [rows] = await pool.query(
      'SELECT password_hash FROM admin_users WHERE id = ? LIMIT 1',
      [admin.id]
    );
    if (rows.length === 0 || rows[0].password_hash !== hashPassword(oldPassword)) {
      sendJson(res, 400, { error: '旧密码错误' });
      return;
    }

    await pool.query(
      'UPDATE admin_users SET password_hash = ? WHERE id = ?',
      [hashPassword(newPassword), admin.id]
    );

    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = {
  login,
  logout,
  me,
  changePassword,
  getAdminUser,
};
