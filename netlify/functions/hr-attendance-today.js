const { sql } = require('./utils/db');
const { requireAuth, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  const { error } = requireAuth(event);
  if (error) return error;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await sql`
      SELECT e.name, e.designation, e.mobile, a.status, a.check_in,
             b.name AS branch_name
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      LEFT JOIN branches b ON b.id = e.branch_id
      WHERE a.work_date = ${today}
      ORDER BY b.name NULLS LAST, e.name
    `;
    return json(200, rows);
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
