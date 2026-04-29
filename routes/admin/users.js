const { sendJson } = require('../../lib/http');
const { getAdminUser } = require('./auth');
const { getFullImageUrl } = require('../../lib/url-helper');

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
      'SELECT id, username, is_disabled, custom_monthly_limit, created_at FROM users WHERE id = ? LIMIT 1',
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

async function getUserGenerations({ req, res, pool }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const userId = Number(url.searchParams.get('userId'));
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;

  if (!userId || userId <= 0) {
    sendJson(res, 400, { error: 'Invalid user id' });
    return;
  }

  try {
    const [[user]] = await pool.query(
      'SELECT id, username FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!user) {
      sendJson(res, 404, { error: 'User not found' });
      return;
    }

    const [generations] = await pool.query(
      `SELECT id, mode, model_id, prompt, input_image_urls, output_image_urls, created_at
       FROM generation_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM generation_history WHERE user_id = ?',
      [userId]
    );

    const parseUrls = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') {
        try { return JSON.parse(field); } catch { return []; }
      }
      return [];
    };

    const mapped = generations.map((row) => ({
      id: row.id,
      mode: row.mode,
      model_id: row.model_id,
      prompt: row.prompt,
      input_image_urls: parseUrls(row.input_image_urls).map(getFullImageUrl),
      output_image_urls: parseUrls(row.output_image_urls).map(getFullImageUrl),
      created_at: row.created_at,
    }));

    sendJson(res, 200, {
      user,
      generations: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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

async function getChartData({ req, res, pool }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  try {
    // 获取最近 12 个月的使用量趋势
    const [monthlyUsage] = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM generation_history
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // 获取最近 12 个月的用户增长趋势
    const [userGrowth] = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // 获取模型使用分布
    const [modelDistribution] = await pool.query(`
      SELECT
        model_id,
        COUNT(*) as count
      FROM generation_history
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY model_id
      ORDER BY count DESC
    `);

    // 获取生成模式分布
    const [modeDistribution] = await pool.query(`
      SELECT
        mode,
        COUNT(*) as count
      FROM generation_history
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY mode
    `);

    // 获取每日生成量（最近 30 天）
    const [dailyGenerations] = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as count
      FROM generation_history
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY date ASC
    `);

    // 获取 TOP 10 活跃用户
    const [topUsers] = await pool.query(`
      SELECT
        u.username,
        COUNT(gh.id) as generation_count
      FROM users u
      LEFT JOIN generation_history gh ON u.id = gh.user_id
      WHERE gh.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY u.id, u.username
      ORDER BY generation_count DESC
      LIMIT 10
    `);

    sendJson(res, 200, {
      monthlyUsage,
      userGrowth,
      modelDistribution,
      modeDistribution,
      dailyGenerations,
      topUsers,
    });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = {
  listUsers,
  getUserDetail,
  getUserGenerations,
  toggleUserStatus,
  deleteUser,
  getStats,
  getChartData,
};
