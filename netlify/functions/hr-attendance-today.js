const { sql } = require('./utils/db');
const { requireAuth, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  const { error } = requireAuth(event);
  if (error) return error;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await sql`
      SELECT e.name, e.designation, a.status, a.check_in
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.work_date = ${today}
    `;
    return json(200, rows);
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
