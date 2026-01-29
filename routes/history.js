const { sendJson } = require('../lib/http');
const { getAuthUser } = require('../services/auth');

async function getHistory({ req, res, pool }) {
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
      `SELECT id, mode, model_id, prompt, input_image_urls, output_image_urls, created_at
       FROM generation_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [user.id, limit, offset]
    );

    const history = rows.map((row) => {
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

      return {
        id: row.id,
        mode: row.mode,
        modelId: row.model_id,
        prompt: row.prompt,
        inputImageUrls: parseIfNeeded(row.input_image_urls),
        outputImageUrls: parseIfNeeded(row.output_image_urls),
        createdAt: row.created_at,
      };
    });

    sendJson(res, 200, { history, limit, offset });
  } catch (err) {
    sendJson(res, 500, { error: `DB error: ${err?.message || String(err)}` });
  }
}

async function saveHistory({ pool, userId, mode, modelId, prompt, inputImageUrls, outputImageUrls }) {
  if (!userId || !mode || !modelId || !prompt || !outputImageUrls || outputImageUrls.length === 0) {
    return null;
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO generation_history (user_id, mode, model_id, prompt, input_image_urls, output_image_urls)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        mode,
        modelId,
        prompt,
        inputImageUrls && inputImageUrls.length > 0 ? JSON.stringify(inputImageUrls) : null,
        JSON.stringify(outputImageUrls),
      ]
    );
    return result.insertId;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to save generation history:', err);
    return null;
  }
}

module.exports = { getHistory, saveHistory };
