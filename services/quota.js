function getMonthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

async function getUserLimit({ pool, userId, defaultLimit }) {
  const [[user]] = await pool.query(
    'SELECT custom_monthly_limit FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  if (!user) {
    return defaultLimit;
  }

  // 如果用户有自定义额度，使用自定义额度；否则使用默认值
  return user.custom_monthly_limit !== null ? user.custom_monthly_limit : defaultLimit;
}

async function getQuota({ pool, userId, month, monthlyLimit }) {
  // 获取用户的实际额度限制
  const userLimit = await getUserLimit({ pool, userId, defaultLimit: monthlyLimit });

  await pool.query(
    'INSERT INTO usage_monthly (user_id, month, used) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE used = used',
    [userId, month]
  );
  const [rows] = await pool.query('SELECT used FROM usage_monthly WHERE user_id = ? AND month = ? LIMIT 1', [userId, month]);
  const used = Number(rows?.[0]?.used || 0);
  const remaining = Math.max(0, userLimit - used);
  return { limit: userLimit, used, remaining, month };
}

async function reserveQuota({ pool, userId, month, count, monthlyLimit }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 获取用户的实际额度限制
    const userLimit = await getUserLimit({ pool: conn, userId, defaultLimit: monthlyLimit });

    await conn.query(
      'INSERT INTO usage_monthly (user_id, month, used) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE used = used',
      [userId, month]
    );
    const [rows] = await conn.query(
      'SELECT used FROM usage_monthly WHERE user_id = ? AND month = ? FOR UPDATE',
      [userId, month]
    );
    const used = Number(rows?.[0]?.used || 0);
    if (used + count > userLimit) {
      await conn.rollback();
      return { ok: false, quota: { limit: userLimit, used, remaining: Math.max(0, userLimit - used), month } };
    }
    const nextUsed = used + count;
    await conn.query('UPDATE usage_monthly SET used = ? WHERE user_id = ? AND month = ?', [nextUsed, userId, month]);
    await conn.commit();
    return {
      ok: true,
      reserved: count,
      quota: { limit: userLimit, used: nextUsed, remaining: Math.max(0, userLimit - nextUsed), month },
    };
  } finally {
    conn.release();
  }
}

async function adjustQuota({ pool, userId, month, delta }) {
  if (!delta) return;
  await pool.query('UPDATE usage_monthly SET used = GREATEST(used + ?, 0) WHERE user_id = ? AND month = ?', [delta, userId, month]);
}

module.exports = { getMonthKey, getQuota, reserveQuota, adjustQuota, getUserLimit };
