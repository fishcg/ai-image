const { sendJson } = require('../lib/http');
const { getAuthUser } = require('../services/auth');

async function getPromptHistory({ req, res, pool }) {
  let user;
  try {
    user = await getAuthUser({ pool, req });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!user) {
    sendJson(res, 401, { error: '请先登录' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const limitRaw = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 20;

  try {
    const [rows] = await pool.query(
      `SELECT id, prompt, negative_prompt, use_count, last_used_at, created_at
       FROM prompt_history
       WHERE user_id = ?
       ORDER BY last_used_at DESC
       LIMIT ?`,
      [user.id, limit]
    );
    sendJson(res, 200, { prompts: rows });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function deletePromptHistory({ req, res, pool, body }) {
  let user;
  try {
    user = await getAuthUser({ pool, req });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
    return;
  }
  if (!user) {
    sendJson(res, 401, { error: '请先登录' });
    return;
  }

  const id = Number(body?.id);
  if (!Number.isFinite(id) || id <= 0) {
    sendJson(res, 400, { error: 'Invalid id' });
    return;
  }

  try {
    const [result] = await pool.query(
      'DELETE FROM prompt_history WHERE id = ? AND user_id = ?',
      [id, user.id]
    );
    if (result.affectedRows === 0) {
      sendJson(res, 404, { error: 'Prompt not found' });
      return;
    }
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function savePromptToHistory({ pool, userId, prompt, negativePrompt }) {
  if (!userId || !prompt?.trim()) return;

  const trimmedPrompt = prompt.trim();
  const trimmedNegative = (negativePrompt || '').trim();

  try {
    // 检查是否已存在相同的提示词
    const [existing] = await pool.query(
      `SELECT id FROM prompt_history
       WHERE user_id = ? AND prompt = ? AND negative_prompt = ?
       LIMIT 1`,
      [userId, trimmedPrompt, trimmedNegative]
    );

    if (existing.length > 0) {
      // 更新使用次数和最后使用时间
      await pool.query(
        `UPDATE prompt_history
         SET use_count = use_count + 1, last_used_at = NOW()
         WHERE id = ?`,
        [existing[0].id]
      );
    } else {
      // 插入新记录
      await pool.query(
        `INSERT INTO prompt_history (user_id, prompt, negative_prompt, use_count, last_used_at)
         VALUES (?, ?, ?, 1, NOW())`,
        [userId, trimmedPrompt, trimmedNegative]
      );
    }

    // 保持每个用户最多 100 条历史记录
    await pool.query(
      `DELETE FROM prompt_history
       WHERE user_id = ? AND id NOT IN (
         SELECT id FROM (
           SELECT id FROM prompt_history
           WHERE user_id = ?
           ORDER BY last_used_at DESC
           LIMIT 100
         ) AS keep_ids
       )`,
      [userId, userId]
    );
  } catch (err) {
    console.error('Failed to save prompt history:', err);
  }
}

module.exports = {
  getPromptHistory,
  deletePromptHistory,
  savePromptToHistory,
};