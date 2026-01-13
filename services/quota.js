function getMonthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

async function getQuota({ pool, userId, month, monthlyLimit }) {
  await pool.query(
    'INSERT INTO usage_monthly (user_id, month, used) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE used = used',
    [userId, month]
  );
  const [rows] = await pool.query('SELECT used FROM usage_monthly WHERE user_id = ? AND month = ? LIMIT 1', [userId, month]);
  const used = Number(rows?.[0]?.used || 0);
  const remaining = Math.max(0, monthlyLimit - used);
  return { limit: monthlyLimit, used, remaining, month };
}

async function reserveQuota({ pool, userId, month, count, monthlyLimit }) {
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
    if (used + count > monthlyLimit) {
      await conn.rollback();
      return { ok: false, quota: { limit: monthlyLimit, used, remaining: Math.max(0, monthlyLimit - used), month } };
    }
    const nextUsed = used + count;
    await conn.query('UPDATE usage_monthly SET used = ? WHERE user_id = ? AND month = ?', [nextUsed, userId, month]);
    await conn.commit();
    return {
      ok: true,
      reserved: count,
      quota: { limit: monthlyLimit, used: nextUsed, remaining: Math.max(0, monthlyLimit - nextUsed), month },
    };
  } finally {
    conn.release();
  }
}

async function adjustQuota({ pool, userId, month, delta }) {
  if (!delta) return;
  await pool.query('UPDATE usage_monthly SET used = GREATEST(used + ?, 0) WHERE user_id = ? AND month = ?', [delta, userId, month]);
}

module.exports = { getMonthKey, getQuota, reserveQuota, adjustQuota };

