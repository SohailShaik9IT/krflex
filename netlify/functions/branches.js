const { sql } = require('./utils/db');
const { requireAuth, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  const { error } = requireAuth(event);
  if (error) return error;

  try {
    const rows = await sql`SELECT * FROM branches ORDER BY name`;
    return json(200, rows);
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
