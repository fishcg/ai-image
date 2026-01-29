const { sendJson } = require('../lib/http');
const { getAuthUser } = require('../services/auth');
const { getFullImageUrl, extractOssPath } = require('../lib/url-helper');

// 获取首页图片列表
async function getGallery({ req, res, pool }) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  const featured = url.searchParams.get('featured') === '1';

  try {
    let query = `
      SELECT g.id, g.image_url, g.prompt, g.description, g.tags, g.likes, g.is_featured, g.created_at,
             u.username
      FROM gallery g
      LEFT JOIN users u ON g.user_id = u.id
      WHERE g.status = 'approved'
    `;

    if (featured) {
      query += ' AND g.is_featured = TRUE';
    }

    query += ' ORDER BY g.is_featured DESC, g.created_at DESC LIMIT ? OFFSET ?';

    const [rows] = await pool.query(query, [limit, offset]);

    const gallery = rows.map((row) => ({
      id: row.id,
      imageUrl: getFullImageUrl(row.image_url),
      prompt: row.prompt,
      description: row.description,
      tags: row.tags ? row.tags.split(',').map((t) => t.trim()) : [],
      likes: row.likes,
      isFeatured: Boolean(row.is_featured),
      username: row.username || '管理员',
      createdAt: row.created_at,
    }));

    sendJson(res, 200, { gallery, limit, offset });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

// 用户分享图片到首页
async function shareToGallery({ req, res, pool, body }) {
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

  const historyId = Number(body?.historyId);
  const imageUrl = String(body?.imageUrl || '').trim();
  const description = String(body?.description || '').trim();
  const tags = String(body?.tags || '').trim();

  if (!historyId || !imageUrl) {
    sendJson(res, 400, { error: 'historyId and imageUrl are required' });
    return;
  }

  // 提取 OSS 相对路径
  const imagePath = extractOssPath(imageUrl);

  try {
    // 验证历史记录属于该用户
    const [historyRows] = await pool.query(
      'SELECT id, prompt FROM generation_history WHERE id = ? AND user_id = ? LIMIT 1',
      [historyId, user.id]
    );

    if (!historyRows || historyRows.length === 0) {
      sendJson(res, 404, { error: '历史记录不存在' });
      return;
    }

    const prompt = historyRows[0].prompt;

    // 检查是否已经分享过这张图片（使用相对路径检查）
    const [existingRows] = await pool.query(
      'SELECT id FROM gallery WHERE user_id = ? AND image_url = ? LIMIT 1',
      [user.id, imagePath]
    );

    if (existingRows && existingRows.length > 0) {
      sendJson(res, 409, { error: '已经分享过这张图片' });
      return;
    }

    // 插入到 gallery 表（存储相对路径）
    await pool.query(
      `INSERT INTO gallery (user_id, history_id, image_url, prompt, description, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
      [user.id, historyId, imagePath, prompt, description, tags]
    );

    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

// 点赞图片
async function likeGalleryImage({ req, res, pool, body }) {
  const imageId = Number(body?.imageId);

  if (!imageId) {
    sendJson(res, 400, { error: 'imageId is required' });
    return;
  }

  try {
    await pool.query('UPDATE gallery SET likes = likes + 1 WHERE id = ? AND status = ?', [imageId, 'approved']);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = { getGallery, shareToGallery, likeGalleryImage };
