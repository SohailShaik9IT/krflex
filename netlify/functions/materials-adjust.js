const { sql } = require('./utils/db');
const { requireAdmin, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'PATCH' && event.httpMethod !== 'POST') return json(405, { message: 'Method not allowed' });

  const { error, user } = requireAdmin(event);
  if (error) return error;

  try {
    const id = event.queryStringParameters && event.queryStringParameters.id;
    const { delta } = JSON.parse(event.body || '{}');
    if (!id || typeof delta !== 'number') return json(400, { message: 'id (query) and delta (body) are required' });

    const now = Math.floor(Date.now() / 1000);
    const rows = await sql`
      UPDATE material_stock
      SET no_of_rolls = GREATEST(0, no_of_rolls + ${delta}), updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return json(404, { message: 'Material not found' });

    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, logged_at)
      VALUES (${user.sub}, ${delta >= 0 ? 'Stock Increased' : 'Stock Decreased'}, 'MaterialStock', ${id},
              ${'Delta ' + delta + ', New Count ' + rows[0].no_of_rolls}, ${now})
    `;
    return json(200, rows[0]);
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
