const { sendJson } = require('../../lib/http');
const { getAdminUser } = require('./auth');
const { getFullImageUrl, extractOssPath } = require('../../lib/url-helper');

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

async function listImages({ req, res, pool }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 24));
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pool.query(
      `SELECT h.id, h.user_id, h.mode, h.model_id, h.prompt, h.output_image_urls, h.created_at,
              u.username,
              (SELECT COUNT(*) FROM gallery g WHERE g.history_id = h.id) AS shared_count
       FROM generation_history h
       LEFT JOIN users u ON h.user_id = u.id
       ORDER BY h.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM generation_history');

    const parseUrls = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') { try { return JSON.parse(field); } catch {} }
      return [];
    };

    const images = rows.map((row) => {
      const outputUrls = parseUrls(row.output_image_urls);
      return {
        id: row.id,
        userId: row.user_id,
        username: row.username || '未知用户',
        mode: row.mode,
        modelId: row.model_id,
        prompt: row.prompt,
        outputImageUrls: outputUrls.map(getFullImageUrl),
        createdAt: row.created_at,
        sharedCount: Number(row.shared_count) || 0,
      };
    });

    sendJson(res, 200, {
      images,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function deleteImage({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const id = Number(body?.id);
  if (!id || id <= 0) { sendJson(res, 400, { error: 'Invalid id' }); return; }

  try {
    const [result] = await pool.query('DELETE FROM generation_history WHERE id = ?', [id]);
    if (result.affectedRows === 0) { sendJson(res, 404, { error: 'Not found' }); return; }
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function shareToHome({ req, res, pool, body }) {
  const admin = await requireAdmin({ pool, req, res });
  if (!admin) return;

  const historyId = Number(body?.historyId);
  const imageUrl = String(body?.imageUrl || '').trim();

  if (!historyId || !imageUrl) {
    sendJson(res, 400, { error: 'historyId and imageUrl are required' });
    return;
  }

  const imagePath = extractOssPath(imageUrl);

  try {
    const [historyRows] = await pool.query(
      'SELECT id, user_id, prompt FROM generation_history WHERE id = ? LIMIT 1',
      [historyId]
    );
    if (!historyRows || historyRows.length === 0) {
      sendJson(res, 404, { error: '历史记录不存在' });
      return;
    }

    const { user_id, prompt } = historyRows[0];

    const [existing] = await pool.query(
      'SELECT id FROM gallery WHERE history_id = ? AND image_url = ? LIMIT 1',
      [historyId, imagePath]
    );
    if (existing && existing.length > 0) {
      sendJson(res, 409, { error: '已经分享过这张图片' });
      return;
    }

    await pool.query(
      `INSERT INTO gallery (user_id, history_id, image_url, prompt, status) VALUES (?, ?, ?, ?, 'approved')`,
      [user_id, historyId, imagePath, prompt]
    );

    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = { listImages, deleteImage, shareToHome };
