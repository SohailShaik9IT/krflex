const { sql } = require('./utils/db');
const { requireAdmin, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { message: 'Method not allowed' });

  const { error } = requireAdmin(event);
  if (error) return error;

  try {
    const q = event.queryStringParameters || {};
    const employeeId = q.employeeId;
    const status = q.status;
    if (!employeeId || !status) return json(400, { message: 'employeeId and status query params are required' });

    const today = new Date().toISOString().slice(0, 10);
    const now = Math.floor(Date.now() / 1000);

    const rows = await sql`
      INSERT INTO attendance (employee_id, work_date, status, check_in)
      VALUES (${employeeId}, ${today}, ${status}, ${now})
      ON CONFLICT (employee_id, work_date)
      DO UPDATE SET status = ${status}
      RETURNING *
    `;
    return json(200, rows[0]);
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
