const { sql } = require('./utils/db');
const { requireAuth, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  const { error } = requireAuth(event);
  if (error) return error;

  try {
    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id) return json(400, { message: 'id query param is required' });

    const rows = await sql`
      SELECT o.id, o.order_date AS date, m.media_name AS material,
             o.order_name, o.sqft, o.status, o.delivered_datetime
      FROM orders o
      JOIN material_stock m ON m.id = o.material_id
      WHERE o.customer_id = ${id}
      ORDER BY o.order_date DESC
    `;
    return json(200, rows);
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
