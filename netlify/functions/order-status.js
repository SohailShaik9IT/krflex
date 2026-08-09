const { sql } = require('./utils/db');
const { requireAuth, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'PATCH' && event.httpMethod !== 'POST') return json(405, { message: 'Method not allowed' });

  const { error, user } = requireAuth(event);
  if (error) return error;

  try {
    const id = event.queryStringParameters && event.queryStringParameters.id;
    const { status } = JSON.parse(event.body || '{}');
    if (!id || !status) return json(400, { message: 'id (query) and status (body) are required' });
    if (!['In Progress', 'Completed', 'Delivered'].includes(status)) {
      return json(400, { message: 'status must be In Progress, Completed, or Delivered' });
    }

    const now = Math.floor(Date.now() / 1000);
    const rows = status === 'Delivered'
      ? await sql`UPDATE orders SET status = ${status}, delivered_datetime = ${now} WHERE id = ${id} RETURNING *`
      : await sql`UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING *`;

    if (rows.length === 0) return json(404, { message: 'Order not found' });

    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, logged_at)
      VALUES (${user.sub}, 'Order Status Changed', 'Order', ${id}, ${'-> ' + status}, ${now})
    `;
    return json(200, rows[0]);
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
