const { sendJson } = require('../../lib/http');
const { getAdminUser } = require('./auth');

async function requireAdmin({ pool, req, res }) {
  try {
    const admin = await getAdminUser({ pool, req });
    if (!admin) {
      sendJson(res, 401, { error: '请先登录管理后台' });
      return null;
    }
    return admin;
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return null;
  }
}

async function getUserQuota({ req, res, pool, monthlyLimit }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const userId = Number(url.searchParams.get('userId'));
  const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

  if (!userId || userId <= 0) {
    sendJson(res, 400, { error: 'Invalid user id' });
    return;
  }

  try {
    const [[user]] = await pool.query(
      'SELECT id, username, custom_monthly_limit FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!user) {
      sendJson(res, 404, { error: 'User not found' });
      return;
    }

    const [[usage]] = await pool.query(
      'SELECT used FROM usage_monthly WHERE user_id = ? AND month = ? LIMIT 1',
      [userId, month]
    );

    const used = usage?.used || 0;
    const userLimit = user.custom_monthly_limit !== null ? user.custom_monthly_limit : monthlyLimit;
    const remaining = Math.max(0, userLimit - used);

    sendJson(res, 200, {
      userId,
      username: user.username,
      month,
      used,
      limit: userLimit,
      customLimit: user.custom_monthly_limit,
      defaultLimit: monthlyLimit,
      remaining,
    });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function setUserLimit({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const userId = Number(body?.userId);
  const limit = body?.limit;

  if (!userId || userId <= 0) {
    sendJson(res, 400, { error: 'Invalid user id' });
    return;
  }

  // limit 可以是 null（使用默认值）或正整数
  if (limit !== null && (!Number.isFinite(limit) || limit < 0)) {
    sendJson(res, 400, { error: 'Invalid limit value' });
    return;
  }

  try {
    const [[user]] = await pool.query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!user) {
      sendJson(res, 404, { error: 'User not found' });
      return;
    }

    await pool.query(
      'UPDATE users SET custom_monthly_limit = ? WHERE id = ?',
      [limit, userId]
    );

    sendJson(res, 200, { success: true, limit });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function resetUsage({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const userId = Number(body?.userId);
  const month = String(body?.month || '').trim();

  if (!userId || userId <= 0) {
    sendJson(res, 400, { error: 'Invalid user id' });
    return;
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    sendJson(res, 400, { error: 'Invalid month format (expected YYYY-MM)' });
    return;
  }

  try {
    const [[user]] = await pool.query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!user) {
      sendJson(res, 404, { error: 'User not found' });
      return;
    }

    await pool.query(
      'DELETE FROM usage_monthly WHERE user_id = ? AND month = ?',
      [userId, month]
    );

    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function batchSetLimit({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const userIds = body?.userIds;
  const limit = body?.limit;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    sendJson(res, 400, { error: 'Invalid userIds' });
    return;
  }

  if (limit !== null && (!Number.isFinite(limit) || limit < 0)) {
    sendJson(res, 400, { error: 'Invalid limit value' });
    return;
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const userId of userIds) {
        await connection.query(
          'UPDATE users SET custom_monthly_limit = ? WHERE id = ?',
          [limit, userId]
        );
      }

      await connection.commit();
      sendJson(res, 200, { success: true, affected: userIds.length });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = {
  getUserQuota,
  setUserLimit,
  resetUsage,
  batchSetLimit,
};
