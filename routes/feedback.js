const { sendJson } = require('../lib/http');
const { getAuthUser } = require('../services/auth');

async function submitFeedback({ req, res, pool, body }) {
  let user = null;
  try {
    user = await getAuthUser({ pool, req });
  } catch {}

  const content = String(body?.content || '').trim();
  const contact = String(body?.contact || '').trim();

  if (!content) {
    sendJson(res, 400, { error: '反馈内容不能为空' });
    return;
  }
  if (content.length > 2000) {
    sendJson(res, 400, { error: '反馈内容不能超过 2000 字' });
    return;
  }

  try {
    await pool.query(
      'INSERT INTO feedback (user_id, username, content, contact) VALUES (?, ?, ?, ?)',
      [user?.id || null, user?.username || null, content, contact || null]
    );
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = { submitFeedback };
