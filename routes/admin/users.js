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

async function listUsers({ req, res, pool }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search') || '';
  const sortBy = url.searchParams.get('sortBy') || 'created_at'; // created_at, usage, username
  const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'ASC' : 'DESC';

  try {
    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE u.username LIKE ?';
      params.push(`%${search}%`);
    }

    // 构建排序子句
    let orderByClause = '';
    if (sortBy === 'usage') {
      orderByClause = `ORDER BY current_month_used ${sortOrder}, u.id DESC`;
    } else if (sortBy === 'username') {
      orderByClause = `ORDER BY u.username ${sortOrder}`;
    } else {
      orderByClause = `ORDER BY u.created_at ${sortOrder}`;
    }

    const [users] = await pool.query(
      `SELECT u.id, u.username, u.is_disabled, u.created_at,
              COALESCE(um.used, 0) as current_month_used
       FROM users u
       LEFT JOIN usage_monthly um ON u.id = um.user_id AND um.month = DATE_FORMAT(NOW(), '%Y-%m')
       ${whereClause}
       ${orderByClause}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );

    sendJson(res, 200, {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      sorting: {
        sortBy,
        sortOrder,
      },
    });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function getUserDetail({ req, res, pool }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const userId = Number(url.searchParams.get('id'));

  if (!userId || userId <= 0) {
    sendJson(res, 400, { error: 'Invalid user id' });
    return;
  }

  try {
    const [[user]] = await pool.query(
      'SELECT id, username, is_disabled, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!user) {
      sendJson(res, 404, { error: 'User not found' });
      return;
    }

    // Get usage history
    const [usageHistory] = await pool.query(
      `SELECT month, used FROM usage_monthly WHERE user_id = ? ORDER BY month DESC LIMIT 12`,
      [userId]
    );

    // Get generation count
    const [[{ generationCount }]] = await pool.query(
      'SELECT COUNT(*) as generationCount FROM generation_history WHERE user_id = ?',
      [userId]
    );

    sendJson(res, 200, {
      user,
      usageHistory,
      generationCount,
    });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function toggleUserStatus({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const userId = Number(body?.id);
  const isDisabled = Boolean(body?.isDisabled);

  if (!userId || userId <= 0) {
    sendJson(res, 400, { error: 'Invalid user id' });
    return;
  }

  try {
    const [result] = await pool.query(
      'UPDATE users SET is_disabled = ? WHERE id = ?',
      [isDisabled, userId]
    );

    if (result.affectedRows === 0) {
      sendJson(res, 404, { error: 'User not found' });
      return;
    }

    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function deleteUser({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const userId = Number(body?.id);

  if (!userId || userId <= 0) {
    sendJson(res, 400, { error: 'Invalid user id' });
    return;
  }

  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      sendJson(res, 404, { error: 'User not found' });
      return;
    }

    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function getStats({ req, res, pool }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ activeUsers }]] = await pool.query(
      'SELECT COUNT(*) as activeUsers FROM users WHERE is_disabled = FALSE'
    );
    const [[{ totalGenerations }]] = await pool.query(
      'SELECT COUNT(*) as totalGenerations FROM generation_history'
    );
    const [[{ thisMonthGenerations }]] = await pool.query(
      `SELECT COUNT(*) as thisMonthGenerations FROM generation_history
       WHERE DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`
    );

    sendJson(res, 200, {
      totalUsers,
      activeUsers,
      disabledUsers: totalUsers - activeUsers,
      totalGenerations,
      thisMonthGenerations,
    });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = {
  listUsers,
  getUserDetail,
  toggleUserStatus,
  deleteUser,
  getStats,
};
