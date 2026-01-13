const http = require('http');
const path = require('path');
const axios = require('axios');
const { getPool } = require('./lib/mysql');
const { sendText, serveStatic } = require('./lib/http');
const authRoutes = require('./routes/auth');
const generateRoutes = require('./routes/generate');
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
const providerTimeoutMsDashScope = Number(process.env.DASHSCOPE_TIMEOUT || ai?.TIMEOUT || 120000);
const providerTimeoutMsNanoAi = Number(process.env.NANOAI_TIMEOUT || nanoai?.timeout || 120000);

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
    await generateRoutes.generate({
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

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method Not Allowed');
    return;
  }

  serveStatic({ req, res, publicDir });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Web UI running: http://localhost:${PORT}`);
});
