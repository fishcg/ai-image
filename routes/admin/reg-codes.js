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

async function listCodes({ req, res, pool }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM registration_codes ORDER BY created_at DESC'
    );
    sendJson(res, 200, { codes: rows });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function createCode({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const code = String(body?.code || '').trim();
  const maxUses = Number(body?.maxUses) || 0;
  const isActive = body?.isActive !== false;
  const expiresAt = body?.expiresAt || null;

  if (!code) { sendJson(res, 400, { error: '注册码不能为空' }); return; }

  try {
    const [result] = await pool.query(
      'INSERT INTO registration_codes (code, max_uses, is_active, expires_at) VALUES (?, ?, ?, ?)',
      [code, maxUses, isActive, expiresAt]
    );
    sendJson(res, 200, { success: true, id: result.insertId });
  } catch (err) {
    if (String(err?.code) === 'ER_DUP_ENTRY') {
      sendJson(res, 409, { error: '注册码已存在' });
      return;
    }
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function updateCode({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const id = Number(body?.id);
  if (!id || id <= 0) { sendJson(res, 400, { error: 'Invalid id' }); return; }

  const fields = [];
  const params = [];

  if (body.code !== undefined) { fields.push('code = ?'); params.push(String(body.code).trim()); }
  if (body.maxUses !== undefined) { fields.push('max_uses = ?'); params.push(Number(body.maxUses) || 0); }
  if (body.isActive !== undefined) { fields.push('is_active = ?'); params.push(Boolean(body.isActive)); }
  if (body.expiresAt !== undefined) { fields.push('expires_at = ?'); params.push(body.expiresAt || null); }

  if (fields.length === 0) { sendJson(res, 400, { error: 'No fields to update' }); return; }

  try {
    params.push(id);
    const [result] = await pool.query(`UPDATE registration_codes SET ${fields.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) { sendJson(res, 404, { error: 'Not found' }); return; }
    sendJson(res, 200, { success: true });
  } catch (err) {
    if (String(err?.code) === 'ER_DUP_ENTRY') {
      sendJson(res, 409, { error: '注册码已存在' });
      return;
    }
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function deleteCode({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const id = Number(body?.id);
  if (!id || id <= 0) { sendJson(res, 400, { error: 'Invalid id' }); return; }

  try {
    const [result] = await pool.query('DELETE FROM registration_codes WHERE id = ?', [id]);
    if (result.affectedRows === 0) { sendJson(res, 404, { error: 'Not found' }); return; }
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = {
  listCodes,
  createCode,
  updateCode,
  deleteCode,
};
