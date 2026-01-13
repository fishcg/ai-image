const crypto = require('crypto');

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function validateUsername(username) {
  if (!username) return '用户名不能为空';
  if (username.length < 3 || username.length > 32) return '用户名长度需为 3–32';
  if (!/^[a-z0-9._-]+$/.test(username)) return '用户名仅支持 a-z 0-9 . _ -';
  return null;
}

function validatePassword(password, { minLen }) {
  if (!password) return '密码不能为空';
  if (String(password).length < minLen) return `密码长度至少 ${minLen} 位`;
  return null;
}

function pbkdf2HashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 210000;
  const hash = crypto.pbkdf2Sync(String(password), salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

function pbkdf2VerifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4) return false;
  const [algo, iterRaw, salt, hashHex] = parts;
  if (algo !== 'pbkdf2_sha256') return false;
  const iterations = Number(iterRaw);
  if (!Number.isFinite(iterations) || iterations < 10000) return false;
  const actual = crypto.pbkdf2Sync(String(password), salt, iterations, 32, 'sha256').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(hashHex, 'hex'));
  } catch {
    return false;
  }
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function validateInviteCode(inviteCodeRaw, { registrationCodes }) {
  if (!registrationCodes || registrationCodes.length === 0) return '服务端未配置 REGISTRATION_CODE';
  const inviteCode = String(inviteCodeRaw || '').trim();
  if (!inviteCode) return '注册码不能为空';
  if (!registrationCodes.includes(inviteCode)) return '注册码无效';
  return null;
}

async function getAuthUser({ pool, req }) {
  const header = String(req.headers.cookie || '');
  if (!header) return null;
  const match = /(?:^|;\s*)sid=([^;]+)/.exec(header);
  const sid = match ? decodeURIComponent(match[1]) : '';
  if (!sid) return null;

  const tokenHash = sha256Hex(sid);
  const [rows] = await pool.query(
    `SELECT u.id, u.username
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return rows?.[0] || null;
}

module.exports = {
  normalizeUsername,
  validateUsername,
  validatePassword,
  pbkdf2HashPassword,
  pbkdf2VerifyPassword,
  sha256Hex,
  validateInviteCode,
  getAuthUser,
};

