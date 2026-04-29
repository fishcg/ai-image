const { sendJson } = require('../lib/http');
const { getAuthUser } = require('../services/auth');

const MAX_PRESETS_PER_USER = 50;

async function getPresets({ req, res, pool }) {
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

  try {
    const [rows] = await pool.query(
      'SELECT id, name, prompt, negative_prompt, created_at FROM user_presets WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );
    sendJson(res, 200, { presets: rows });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function createPreset({ req, res, pool, body }) {
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

  const name = String(body?.name || '').trim();
  const prompt = String(body?.prompt || '').trim();
  const negativePrompt = String(body?.negativePrompt || '').trim();

  if (!name) { sendJson(res, 400, { error: '预设名称不能为空' }); return; }
  if (!prompt) { sendJson(res, 400, { error: 'Prompt 不能为空' }); return; }

  try {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM user_presets WHERE user_id = ?',
      [user.id]
    );
    if (count >= MAX_PRESETS_PER_USER) {
      sendJson(res, 400, { error: `最多保存 ${MAX_PRESETS_PER_USER} 个预设` });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO user_presets (user_id, name, prompt, negative_prompt) VALUES (?, ?, ?, ?)',
      [user.id, name, prompt, negativePrompt]
    );
    sendJson(res, 200, { success: true, id: result.insertId });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function deletePreset({ req, res, pool, body }) {
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
  if (!id || id <= 0) { sendJson(res, 400, { error: 'Invalid id' }); return; }

  try {
    const [result] = await pool.query(
      'DELETE FROM user_presets WHERE id = ? AND user_id = ?',
      [id, user.id]
    );
    if (result.affectedRows === 0) {
      sendJson(res, 404, { error: 'Preset not found' });
      return;
    }
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = { getPresets, createPreset, deletePreset };
