const { sendJson } = require('../../lib/http');
const { getAdminUser } = require('./auth');

async function requireAdmin({ pool, req, res }) {
  const admin = await getAdminUser({ pool, req });
  if (!admin) {
    sendJson(res, 401, { error: '请先登录管理后台' });
    return null;
  }
  return admin;
}

const SETTING_DEFAULTS = {
  monthly_limit: '200',
  session_ttl_days: '30',
  max_upload_mb: '60',
};

async function getSettings({ req, res, pool }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  try {
    const [rows] = await pool.query('SELECT `key`, `value`, updated_at FROM system_settings');
    const settings = { ...SETTING_DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    sendJson(res, 200, { settings });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function updateSettings({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const settings = body?.settings;
  if (!settings || typeof settings !== 'object') {
    sendJson(res, 400, { error: 'Invalid settings' });
    return;
  }

  const allowedKeys = Object.keys(SETTING_DEFAULTS);

  try {
    for (const [key, value] of Object.entries(settings)) {
      if (!allowedKeys.includes(key)) continue;
      await pool.query(
        'INSERT INTO system_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        [key, String(value), String(value)]
      );
    }

    // 清除缓存
    settingsCache.ts = 0;

    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

// 带缓存的设置读取（供 server.js 使用）
const settingsCache = { data: null, ts: 0 };
const CACHE_TTL = 60 * 1000;

async function getCachedSetting(pool, key, fallback) {
  const now = Date.now();
  if (!settingsCache.data || now - settingsCache.ts > CACHE_TTL) {
    try {
      const [rows] = await pool.query('SELECT `key`, `value` FROM system_settings');
      settingsCache.data = {};
      for (const row of rows) {
        settingsCache.data[row.key] = row.value;
      }
      settingsCache.ts = now;
    } catch {
      if (!settingsCache.data) settingsCache.data = {};
    }
  }
  const val = settingsCache.data[key];
  if (val === undefined || val === null) return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

module.exports = {
  getSettings,
  updateSettings,
  getCachedSetting,
  SETTING_DEFAULTS,
};
