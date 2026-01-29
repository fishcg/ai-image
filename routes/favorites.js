const { readBody, sendJson } = require('../lib/http');
const { getAuthUser } = require('../services/auth');
const { getFullImageUrl, extractOssPath } = require('../lib/url-helper');

async function getFavorites({ req, res, pool }) {
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
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);

  try {
    const [rows] = await pool.query(
      `SELECT f.id, f.history_id, f.image_url, f.created_at,
              h.mode, h.model_id, h.prompt, h.input_image_urls, h.output_image_urls
       FROM favorites f
       LEFT JOIN generation_history h ON f.history_id = h.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [user.id, limit, offset]
    );

    const favorites = rows.map((row) => {
      // MySQL JSON fields may already be parsed by mysql2
      const parseIfNeeded = (field) => {
        if (!field) return [];
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch {
            return [];
          }
        }
        return [];
      };

      // Convert relative paths to full URLs
      const inputPaths = parseIfNeeded(row.input_image_urls);
      const outputPaths = parseIfNeeded(row.output_image_urls);

      return {
        id: row.id,
        historyId: row.history_id,
        imageUrl: getFullImageUrl(row.image_url),
        createdAt: row.created_at,
        history: row.mode
          ? {
              mode: row.mode,
              modelId: row.model_id,
              prompt: row.prompt,
              inputImageUrls: inputPaths.map(path => getFullImageUrl(path)),
              outputImageUrls: outputPaths.map(path => getFullImageUrl(path)),
            }
          : null,
      };
    });

    sendJson(res, 200, { favorites, limit, offset });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function addFavorite({ req, res, pool }) {
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

  let body;
  try {
    body = await readBody(req, { maxBytes: 32 * 1024 });
  } catch {
    sendJson(res, 400, { error: 'Failed to read request body' });
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(body.toString('utf8'));
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const historyId = Number(parsed?.historyId);
  const imageUrl = String(parsed?.imageUrl || '').trim();

  if (!historyId || !imageUrl) {
    sendJson(res, 400, { error: 'historyId and imageUrl are required' });
    return;
  }

  // Extract relative path from full URL
  const imagePath = extractOssPath(imageUrl);

  try {
    // Verify history belongs to user
    const [rows] = await pool.query('SELECT id FROM generation_history WHERE id = ? AND user_id = ? LIMIT 1', [
      historyId,
      user.id,
    ]);

    if (!rows || rows.length === 0) {
      sendJson(res, 404, { error: '历史记录不存在' });
      return;
    }

    await pool.query('INSERT INTO favorites (user_id, history_id, image_url) VALUES (?, ?, ?)', [
      user.id,
      historyId,
      imagePath,
    ]);

    sendJson(res, 200, { ok: true });
  } catch (err) {
    if (String(err?.code) === 'ER_DUP_ENTRY') {
      sendJson(res, 409, { error: '已经收藏过这张图片' });
      return;
    }
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function removeFavorite({ req, res, pool }) {
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

  let body;
  try {
    body = await readBody(req, { maxBytes: 32 * 1024 });
  } catch {
    sendJson(res, 400, { error: 'Failed to read request body' });
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(body.toString('utf8'));
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const id = Number(parsed?.id);

  if (!id) {
    sendJson(res, 400, { error: 'id is required' });
    return;
  }

  try {
    const [result] = await pool.query('DELETE FROM favorites WHERE id = ? AND user_id = ? LIMIT 1', [id, user.id]);

    if (result.affectedRows === 0) {
      sendJson(res, 404, { error: '收藏不存在' });
      return;
    }

    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

module.exports = { getFavorites, addFavorite, removeFavorite };
