const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { UploadFile } = require('./lib/OSS');
const { getPool } = require('./lib/mysql');
const { http: httpConfig, dc, ai, mysql: mysqlConfig, auth: authConfig } = require('./config');

const PORT = Number(process.env.PORT || httpConfig?.port || 7992);
const MONTHLY_LIMIT = Number(process.env.MONTHLY_LIMIT || 200);
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 30);
const PASSWORD_MIN_LEN = 6;
const REGISTRATION_CODES = String(
  process.env.REGISTRATION_CODE ||
    process.env.REGISTRATION_CODES ||
    authConfig?.registrationCode ||
    authConfig?.registrationCodes ||
    ''
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function getDbConfig() {
  return {
    host: process.env.MYSQL_HOST || mysqlConfig?.host || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || mysqlConfig?.port || 3306),
    user: process.env.MYSQL_USER || mysqlConfig?.user || 'root',
    password: process.env.MYSQL_PASSWORD || mysqlConfig?.password || '',
    database: process.env.MYSQL_DATABASE || mysqlConfig?.database || 'ai_image',
  };
}

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

function parseCookies(req) {
  const header = String(req.headers.cookie || '');
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || '/'}`);
  if (opts.maxAge != null) parts.push(`Max-Age=${Math.floor(opts.maxAge)}`);
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  if (opts.secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearCookie(res, name) {
  setCookie(res, name, '', { maxAge: 0 });
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

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function validateUsername(username) {
  if (!username) return '用户名不能为空';
  if (username.length < 3 || username.length > 32) return '用户名长度需为 3–32';
  if (!/^[a-z0-9._-]+$/.test(username)) return '用户名仅支持 a-z 0-9 . _ -';
  return null;
}

function validatePassword(password) {
  if (!password) return '密码不能为空';
  if (String(password).length < PASSWORD_MIN_LEN) return `密码长度至少 ${PASSWORD_MIN_LEN} 位`;
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

function getMonthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function validateInviteCode(inviteCodeRaw) {
  if (REGISTRATION_CODES.length === 0) return '服务端未配置 REGISTRATION_CODE';
  const inviteCode = String(inviteCodeRaw || '').trim();
  if (!inviteCode) return '注册码不能为空';
  if (!REGISTRATION_CODES.includes(inviteCode)) return '注册码无效';
  return null;
}

async function getAuthUser(req) {
  const sid = parseCookies(req).sid;
  if (!sid) return null;

  const pool = getPool(getDbConfig());
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

async function getQuota(pool, userId, month) {
  await pool.query(
    'INSERT INTO usage_monthly (user_id, month, used) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE used = used',
    [userId, month]
  );
  const [rows] = await pool.query('SELECT used FROM usage_monthly WHERE user_id = ? AND month = ? LIMIT 1', [userId, month]);
  const used = Number(rows?.[0]?.used || 0);
  const remaining = Math.max(0, MONTHLY_LIMIT - used);
  return { limit: MONTHLY_LIMIT, used, remaining, month };
}

async function reserveQuota(userId, month, count) {
  const pool = getPool(getDbConfig());
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'INSERT INTO usage_monthly (user_id, month, used) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE used = used',
      [userId, month]
    );
    const [rows] = await conn.query(
      'SELECT used FROM usage_monthly WHERE user_id = ? AND month = ? FOR UPDATE',
      [userId, month]
    );
    const used = Number(rows?.[0]?.used || 0);
    if (used + count > MONTHLY_LIMIT) {
      await conn.rollback();
      return { ok: false, quota: { limit: MONTHLY_LIMIT, used, remaining: Math.max(0, MONTHLY_LIMIT - used), month } };
    }
    const nextUsed = used + count;
    await conn.query('UPDATE usage_monthly SET used = ? WHERE user_id = ? AND month = ?', [nextUsed, userId, month]);
    await conn.commit();
    return {
      ok: true,
      reserved: count,
      quota: { limit: MONTHLY_LIMIT, used: nextUsed, remaining: Math.max(0, MONTHLY_LIMIT - nextUsed), month },
    };
  } finally {
    conn.release();
  }
}

async function adjustQuota(userId, month, delta) {
  if (!delta) return;
  const pool = getPool(getDbConfig());
  await pool.query(
    'UPDATE usage_monthly SET used = GREATEST(used + ?, 0) WHERE user_id = ? AND month = ?',
    [delta, userId, month]
  );
}

async function handleGenerate(req, res) {
  let user;
  try {
    user = await getAuthUser(req);
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!user) {
    sendJson(res, 401, { error: '请先登录' });
    return;
  }

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
  if (images.length > 3) {
    sendJson(res, 400, { error: 'At most 3 input images are allowed' });
    return;
  }

  const month = getMonthKey(new Date());
  let reservation;
  try {
    reservation = await reserveQuota(user.id, month, n);
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!reservation.ok) {
    sendJson(res, 429, { error: '本月额度不足', quota: reservation.quota });
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
    await adjustQuota(user.id, month, -reservation.reserved).catch(() => {});
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
      await adjustQuota(user.id, month, -reservation.reserved).catch(() => {});
      sendJson(res, 502, { error: `DashScope error: ${data.code}`, message: data.message, inputImageUrls: uploadedUrls });
      return;
    }

    const outputImageUrls = extractOutputImageUrls(data);
    const actual = outputImageUrls.length;
    const refund = Math.max(0, reservation.reserved - actual);
    if (refund) {
      await adjustQuota(user.id, month, -refund).catch(() => {});
    }
    const pool = getPool(getDbConfig());
    const quota = await getQuota(pool, user.id, month);
    sendJson(res, 200, { inputImageUrls: uploadedUrls, outputImageUrls, quota, raw: data });
  } catch (err) {
    if (err?.response) {
      await adjustQuota(user.id, month, -reservation.reserved).catch(() => {});
      sendJson(res, 502, { error: `DashScope HTTP ${err.response.status}`, details: err.response.data, inputImageUrls: uploadedUrls });
      return;
    }
    await adjustQuota(user.id, month, -reservation.reserved).catch(() => {});
    sendJson(res, 502, { error: `DashScope request failed: ${err?.message || String(err)}`, inputImageUrls: uploadedUrls });
  }
}

async function handleRegister(req, res) {
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
  const pErr = validatePassword(password);
  if (pErr) return sendJson(res, 400, { error: pErr });
  const iErr = validateInviteCode(inviteCode);
  if (iErr) return sendJson(res, REGISTRATION_CODES.length ? 400 : 500, { error: iErr });

  const passwordHash = pbkdf2HashPassword(password);
  const pool = getPool(getDbConfig());
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

async function handleLogin(req, res) {
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

  const pool = getPool(getDbConfig());
  const [rows] = await pool.query('SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1', [username]);
  const user = rows?.[0];
  if (!user || !pbkdf2VerifyPassword(password, user.password_hash)) {
    sendJson(res, 401, { error: '用户名或密码错误' });
    return;
  }

  const sid = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256Hex(sid);
  const ttlSeconds = Math.max(60, SESSION_TTL_DAYS * 24 * 3600);
  await pool.query(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))',
    [user.id, tokenHash, ttlSeconds]
  );

  setCookie(res, 'sid', sid, { maxAge: ttlSeconds });
  const quota = await getQuota(pool, user.id, getMonthKey(new Date()));
  sendJson(res, 200, { ok: true, user: { id: user.id, username: user.username }, quota });
}

async function handleLogout(req, res) {
  const sid = parseCookies(req).sid;
  clearCookie(res, 'sid');
  if (!sid) {
    sendJson(res, 200, { ok: true });
    return;
  }
  const pool = getPool(getDbConfig());
  await pool.query('DELETE FROM sessions WHERE token_hash = ? LIMIT 1', [sha256Hex(sid)]).catch(() => {});
  sendJson(res, 200, { ok: true });
}

async function handleMe(req, res) {
  let user;
  try {
    user = await getAuthUser(req);
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!user) {
    sendJson(res, 200, { user: null, quota: null });
    return;
  }
  const pool = getPool(getDbConfig());
  const quota = await getQuota(pool, user.id, getMonthKey(new Date()));
  sendJson(res, 200, { user: { id: user.id, username: user.username }, quota });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && url.pathname === '/api/register') {
    await handleRegister(req, res);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/login') {
    await handleLogin(req, res);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/logout') {
    await handleLogout(req, res);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/me') {
    await handleMe(req, res);
    return;
  }

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
