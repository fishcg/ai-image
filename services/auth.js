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

async function validateInviteCode(inviteCodeRaw, { registrationCodes, pool }) {
  const inviteCode = String(inviteCodeRaw || '').trim();
  if (!inviteCode) return { error: '注册码不能为空', codeId: null };

  // 先查数据库
  if (pool) {
    try {
      const [rows] = await pool.query(
        'SELECT id, max_uses, current_uses, is_active, expires_at FROM registration_codes WHERE code = ? LIMIT 1',
        [inviteCode]
      );
      if (rows.length > 0) {
        const row = rows[0];
        if (!row.is_active) return { error: '注册码已停用', codeId: null };
        if (row.expires_at && new Date(row.expires_at) < new Date()) return { error: '注册码已过期', codeId: null };
        if (row.max_uses > 0 && row.current_uses >= row.max_uses) return { error: '注册码已达到使用上限', codeId: null };
        return { error: null, codeId: row.id };
      }
    } catch (err) {
      console.error('Failed to check registration code in DB:', err);
    }
  }

  // fallback 到静态配置
  if (!registrationCodes || registrationCodes.length === 0) return { error: '服务端未配置 REGISTRATION_CODE', codeId: null };
  if (!registrationCodes.includes(inviteCode)) return { error: '注册码无效', codeId: null };
  return { error: null, codeId: null };
}

async function getAuthUser({ pool, req }) {
  const header = String(req.headers.cookie || '');
  if (!header) return null;
  const match = /(?:^|;\s*)sid=([^;]+)/.exec(header);
  const sid = match ? decodeURIComponent(match[1]) : '';
  if (!sid) return null;

  const tokenHash = sha256Hex(sid);
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.is_disabled
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return rows?.[0] || null;
}

async function getApiKeyUser({ pool, req }) {
  const auth = String(req.headers.authorization || '');
  const match = /^Bearer\s+(ak_[a-f0-9]{40})$/i.exec(auth);
  if (!match) return null;

  const apiKey = match[1];
  const keyHash = sha256Hex(apiKey);
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.is_disabled, ak.id AS ak_id
     FROM api_keys ak
     JOIN users u ON u.id = ak.user_id
     WHERE ak.api_key_hash = ?
     LIMIT 1`,
    [keyHash]
  );
  if (!rows?.[0]) return null;

  pool.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = ?', [rows[0].ak_id]).catch(() => {});
  return { id: rows[0].id, username: rows[0].username, is_disabled: rows[0].is_disabled };
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
  getApiKeyUser,
};

