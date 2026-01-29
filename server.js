const http = require('http');
const path = require('path');
const axios = require('axios');
const { getPool } = require('./lib/mysql');
const { sendText, serveStatic } = require('./lib/http');
const authRoutes = require('./routes/auth');
const generateRoutes = require('./routes/generate');
const historyRoutes = require('./routes/history');
const favoritesRoutes = require('./routes/favorites');
const galleryRoutes = require('./routes/gallery');
const { http: httpConfig, dc, ai, nanoai, mysql: mysqlConfig, auth: authConfig } = require('./config');

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

const pool = getPool(getDbConfig());
const publicDir = path.join(__dirname, 'public');
const providerTimeoutMsDashScope = Number(process.env.DASHSCOPE_TIMEOUT || ai?.TIMEOUT || 5 * 60 * 1000);
const providerTimeoutMsNanoAi = Number(process.env.NANOAI_TIMEOUT || nanoai?.timeout || 5 * 60 * 1000);
const generateRequestTimeoutMs = Number(process.env.GENERATE_REQUEST_TIMEOUT || 5 * 60 * 1000);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && url.pathname === '/api/register') {
    await authRoutes.register({ req, res, pool, passwordMinLen: PASSWORD_MIN_LEN, registrationCodes: REGISTRATION_CODES });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/login') {
    await authRoutes.login({ req, res, pool, sessionTtlDays: SESSION_TTL_DAYS, monthlyLimit: MONTHLY_LIMIT });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/logout') {
    await authRoutes.logout({ req, res, pool });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/me') {
    await authRoutes.me({ req, res, pool, monthlyLimit: MONTHLY_LIMIT });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/generate') {
    req.setTimeout(generateRequestTimeoutMs);
    res.setTimeout(generateRequestTimeoutMs);
    const isAsync = url.searchParams.get('async') === '1';
    const handler = isAsync ? generateRoutes.generateAsyncStart : generateRoutes.generate;
    await handler({
      req,
      res,
      axios,
      pool,
      dc,
      ai,
      nanoai,
      monthlyLimit: MONTHLY_LIMIT,
      providerTimeoutMsDashScope,
      providerTimeoutMsNanoAi,
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/generate') {
    await generateRoutes.generateAsyncStatus({ req, res });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/history') {
    await historyRoutes.getHistory({ req, res, pool });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/favorites') {
    await favoritesRoutes.getFavorites({ req, res, pool });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/favorites') {
    await favoritesRoutes.addFavorite({ req, res, pool });
    return;
  }
  if (req.method === 'DELETE' && url.pathname === '/api/favorites') {
    await favoritesRoutes.removeFavorite({ req, res, pool });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/gallery') {
    await galleryRoutes.getGallery({ req, res, pool });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/gallery/share') {
    const { readBody } = require('./lib/http');
    const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
    await galleryRoutes.shareToGallery({ req, res, pool, body });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/gallery/like') {
    const { readBody } = require('./lib/http');
    const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
    await galleryRoutes.likeGalleryImage({ req, res, pool, body });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method Not Allowed');
    return;
  }

  serveStatic({ req, res, publicDir });
});

server.requestTimeout = generateRequestTimeoutMs;
server.headersTimeout = Math.max(server.headersTimeout, generateRequestTimeoutMs + 10_000);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Web UI running: http://localhost:${PORT}`);
});
