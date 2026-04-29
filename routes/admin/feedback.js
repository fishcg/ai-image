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

async function listFeedback({ req, res, pool }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const status = url.searchParams.get('status') || '';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;

  try {
    let whereClause = '';
    const params = [];
    if (status && ['pending', 'read', 'resolved'].includes(status)) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT * FROM feedback ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM feedback ${whereClause}`,
      params
    );

    sendJson(res, 200, {
      feedback: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function updateFeedback({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const id = Number(body?.id);
  if (!id || id <= 0) { sendJson(res, 400, { error: 'Invalid id' }); return; }

  const fields = [];
  const params = [];

  if (body.status !== undefined && ['pending', 'read', 'resolved'].includes(body.status)) {
    fields.push('status = ?');
    params.push(body.status);
  }
  if (body.adminReply !== undefined) {
    fields.push('admin_reply = ?');
    params.push(String(body.adminReply).trim() || null);
  }

  if (fields.length === 0) { sendJson(res, 400, { error: 'No fields to update' }); return; }

  try {
    params.push(id);
    const [result] = await pool.query(`UPDATE feedback SET ${fields.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) { sendJson(res, 404, { error: 'Not found' }); return; }
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function deleteFeedback({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const id = Number(body?.id);
  if (!id || id <= 0) { sendJson(res, 400, { error: 'Invalid id' }); return; }

  try {
    const [result] = await pool.query('DELETE FROM feedback WHERE id = ?', [id]);
    if (result.affectedRows === 0) { sendJson(res, 404, { error: 'Not found' }); return; }
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = { listFeedback, updateFeedback, deleteFeedback };
