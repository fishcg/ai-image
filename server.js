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
const aiAssistantRoutes = require('./routes/ai-assistant');
const promptHistoryRoutes = require('./routes/prompt-history');
const adminAuthRoutes = require('./routes/admin/auth');
const adminUsersRoutes = require('./routes/admin/users');
const adminQuotaRoutes = require('./routes/admin/quota');
const adminSettingsRoutes = require('./routes/admin/settings');
const adminAnnouncementsRoutes = require('./routes/admin/announcements');
const adminRegCodesRoutes = require('./routes/admin/reg-codes');
const { getCachedSetting } = adminSettingsRoutes;
const { http: httpConfig, dc, ai, nanoai, jimeng, gptimage, mysql: mysqlConfig, auth: authConfig } = require('./config');

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
    host: mysqlConfig?.host || '127.0.0.1',
    port: Number(mysqlConfig?.port || 3306),
    user: mysqlConfig?.user || 'root',
    password: mysqlConfig?.password || '',
    database: mysqlConfig?.database || 'ai_image',
  };
}

const pool = getPool(getDbConfig());
const publicDir = path.join(__dirname, 'public');
const providerTimeoutMsDashScope = Number(process.env.DASHSCOPE_TIMEOUT || ai?.TIMEOUT || 5 * 60 * 1000);
const providerTimeoutMsNanoAi = Number(process.env.NANOAI_TIMEOUT || nanoai?.timeout || 5 * 60 * 1000);
const providerTimeoutMsJiMeng = Number(process.env.JIMENG_TIMEOUT || jimeng?.TIMEOUT || 3 * 60 * 1000);
const providerTimeoutMsGptImage = Number(process.env.GPTIMAGE_TIMEOUT || gptimage?.timeout || 5 * 60 * 1000);
const generateRequestTimeoutMs = Number(process.env.GENERATE_REQUEST_TIMEOUT || 5 * 60 * 1000);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && url.pathname === '/api/register') {
    await authRoutes.register({ req, res, pool, passwordMinLen: PASSWORD_MIN_LEN, registrationCodes: REGISTRATION_CODES });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/login') {
    await authRoutes.login({ req, res, pool, sessionTtlDays: await getCachedSetting(pool, 'session_ttl_days', SESSION_TTL_DAYS), monthlyLimit: await getCachedSetting(pool, 'monthly_limit', MONTHLY_LIMIT) });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/logout') {
    await authRoutes.logout({ req, res, pool });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/me') {
    await authRoutes.me({ req, res, pool, monthlyLimit: await getCachedSetting(pool, 'monthly_limit', MONTHLY_LIMIT) });
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
      jimeng,
      gptimage,
      monthlyLimit: await getCachedSetting(pool, 'monthly_limit', MONTHLY_LIMIT),      providerTimeoutMsDashScope,
      providerTimeoutMsNanoAi,
      providerTimeoutMsJiMeng,
      providerTimeoutMsGptImage,
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
  if (req.method === 'GET' && url.pathname === '/api/prompt-history') {
    await promptHistoryRoutes.getPromptHistory({ req, res, pool });
    return;
  }
  if (req.method === 'DELETE' && url.pathname === '/api/prompt-history') {
    const { readBody } = require('./lib/http');
    const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
    await promptHistoryRoutes.deletePromptHistory({ req, res, pool, body });
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

  // 图片代理：解决浏览器 fetch OSS 图片的跨域问题
  if (req.method === 'GET' && url.pathname === '/api/proxy-image') {
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
      sendText(res, 400, 'Missing url parameter');
      return;
    }
    let targetHost;
    try { targetHost = new URL(targetUrl).hostname; } catch {
      sendText(res, 400, 'Invalid url parameter');
      return;
    }
    // 仅允许 OSS 域名
    const allowedHosts = ['acgay.oss-cn-hangzhou.aliyuncs.com', 'acgay.oss-cn-hangzhou-internal.aliyuncs.com'];
    if (!allowedHosts.includes(targetHost)) {
      sendText(res, 403, 'Forbidden');
      return;
    }
    try {
      const imgResp = await axios.get(targetUrl, { responseType: 'arraybuffer', timeout: 30000 });
      res.writeHead(200, {
        'Content-Type': imgResp.headers['content-type'] || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      });
      res.end(Buffer.from(imgResp.data));
    } catch (err) {
      sendText(res, 502, `Failed to fetch image: ${err.message}`);
    }
    return;
  }

  // AI 辅助功能路由
  if (url.pathname.startsWith('/api/ai/')) {
    const handled = await aiAssistantRoutes.handler({ req, res, ai });
    if (handled !== false) return;
  }

  // 管理后台路由
  if (url.pathname.startsWith('/api/admin/')) {
    // Admin auth
    if (req.method === 'POST' && url.pathname === '/api/admin/login') {
      await adminAuthRoutes.login({ req, res, pool, sessionTtlDays: 7 });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/logout') {
      await adminAuthRoutes.logout({ req, res, pool });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/me') {
      await adminAuthRoutes.me({ req, res, pool });
      return;
    }

    // Admin users
    if (req.method === 'GET' && url.pathname === '/api/admin/users') {
      await adminUsersRoutes.listUsers({ req, res, pool });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/users/detail') {
      await adminUsersRoutes.getUserDetail({ req, res, pool });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/users/detail') {
      await adminUsersRoutes.getUserDetail({ req, res, pool });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/users/generations') {
      await adminUsersRoutes.getUserGenerations({ req, res, pool });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/users/toggle-status') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminUsersRoutes.toggleUserStatus({ req, res, pool, body });
      return;
    }
    if (req.method === 'DELETE' && url.pathname === '/api/admin/users') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminUsersRoutes.deleteUser({ req, res, pool, body });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/stats') {
      await adminUsersRoutes.getStats({ req, res, pool });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/chart-data') {
      await adminUsersRoutes.getChartData({ req, res, pool });
      return;
    }

    // Admin quota
    if (req.method === 'GET' && url.pathname === '/api/admin/quota') {
      await adminQuotaRoutes.getUserQuota({ req, res, pool, monthlyLimit: await getCachedSetting(pool, 'monthly_limit', MONTHLY_LIMIT) });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/quota/set-limit') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminQuotaRoutes.setUserLimit({ req, res, pool, body });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/quota/reset-usage') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminQuotaRoutes.resetUsage({ req, res, pool, body });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/quota/batch-set-limit') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminQuotaRoutes.batchSetLimit({ req, res, pool, body });
      return;
    }

    // Admin settings
    if (req.method === 'GET' && url.pathname === '/api/admin/settings') {
      await adminSettingsRoutes.getSettings({ req, res, pool });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/settings') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminSettingsRoutes.updateSettings({ req, res, pool, body });
      return;
    }

    // Admin announcements
    if (req.method === 'GET' && url.pathname === '/api/admin/announcements') {
      await adminAnnouncementsRoutes.listAnnouncements({ req, res, pool });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/announcements') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminAnnouncementsRoutes.createAnnouncement({ req, res, pool, body });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/announcements/update') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminAnnouncementsRoutes.updateAnnouncement({ req, res, pool, body });
      return;
    }
    if (req.method === 'DELETE' && url.pathname === '/api/admin/announcements') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminAnnouncementsRoutes.deleteAnnouncement({ req, res, pool, body });
      return;
    }

    // Admin registration codes
    if (req.method === 'GET' && url.pathname === '/api/admin/reg-codes') {
      await adminRegCodesRoutes.listCodes({ req, res, pool });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/reg-codes') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminRegCodesRoutes.createCode({ req, res, pool, body });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/reg-codes/update') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminRegCodesRoutes.updateCode({ req, res, pool, body });
      return;
    }
    if (req.method === 'DELETE' && url.pathname === '/api/admin/reg-codes') {
      const { readBody } = require('./lib/http');
      const body = await readBody(req, { maxBytes: 32 * 1024 }).then((b) => JSON.parse(b.toString('utf8'))).catch(() => ({}));
      await adminRegCodesRoutes.deleteCode({ req, res, pool, body });
      return;
    }
  }

  // 公开公告 API（无需登录）
  if (req.method === 'GET' && url.pathname === '/api/announcements') {
    await adminAnnouncementsRoutes.getActiveAnnouncements({ req, res, pool });
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
