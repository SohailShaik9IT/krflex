const { sql } = require('./utils/db');
const { requireAdmin, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  const { error } = requireAdmin(event);
  if (error) return error;

  try {
    const rows = await sql`
      SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status
    `;
    return json(200, rows);
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
