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

async function listAnnouncements({ req, res, pool }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM announcements ORDER BY created_at DESC'
    );
    sendJson(res, 200, { announcements: rows });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function createAnnouncement({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const title = String(body?.title || '').trim();
  const content = String(body?.content || '').trim();
  const type = ['info', 'warning', 'success'].includes(body?.type) ? body.type : 'info';
  const isActive = body?.isActive !== false;
  const startTime = body?.startTime || null;
  const endTime = body?.endTime || null;

  if (!title) { sendJson(res, 400, { error: '标题不能为空' }); return; }
  if (!content) { sendJson(res, 400, { error: '内容不能为空' }); return; }

  try {
    const [result] = await pool.query(
      'INSERT INTO announcements (title, content, type, is_active, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, type, isActive, startTime, endTime]
    );
    sendJson(res, 200, { success: true, id: result.insertId });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function updateAnnouncement({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const id = Number(body?.id);
  if (!id || id <= 0) { sendJson(res, 400, { error: 'Invalid id' }); return; }

  const fields = [];
  const params = [];

  if (body.title !== undefined) { fields.push('title = ?'); params.push(String(body.title).trim()); }
  if (body.content !== undefined) { fields.push('content = ?'); params.push(String(body.content).trim()); }
  if (body.type !== undefined && ['info', 'warning', 'success'].includes(body.type)) { fields.push('type = ?'); params.push(body.type); }
  if (body.isActive !== undefined) { fields.push('is_active = ?'); params.push(Boolean(body.isActive)); }
  if (body.startTime !== undefined) { fields.push('start_time = ?'); params.push(body.startTime || null); }
  if (body.endTime !== undefined) { fields.push('end_time = ?'); params.push(body.endTime || null); }

  if (fields.length === 0) { sendJson(res, 400, { error: 'No fields to update' }); return; }

  try {
    params.push(id);
    const [result] = await pool.query(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) { sendJson(res, 404, { error: 'Not found' }); return; }
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function deleteAnnouncement({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const id = Number(body?.id);
  if (!id || id <= 0) { sendJson(res, 400, { error: 'Invalid id' }); return; }

  try {
    const [result] = await pool.query('DELETE FROM announcements WHERE id = ?', [id]);
    if (result.affectedRows === 0) { sendJson(res, 404, { error: 'Not found' }); return; }
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function getActiveAnnouncements({ req, res, pool }) {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, content, type FROM announcements
       WHERE is_active = TRUE
         AND (start_time IS NULL OR start_time <= NOW())
         AND (end_time IS NULL OR end_time >= NOW())
       ORDER BY created_at DESC`
    );
    sendJson(res, 200, { announcements: rows });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncements,
};
