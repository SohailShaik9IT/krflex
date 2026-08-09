const { sql } = require('./utils/db');
const { requireAuth, requireAdmin, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };

  if (event.httpMethod === 'GET') {
    const { error } = requireAuth(event);
    if (error) return error;
    try {
      const rows = await sql`
      SELECT e.*, b.name AS branch_name
      FROM employees e
      LEFT JOIN branches b ON b.id = e.branch_id
      ORDER BY e.name
    `;
      return json(200, rows);
    } catch (err) {
      console.error(err);
      return json(500, { message: 'Server error', detail: String(err) });
    }
  }

  if (event.httpMethod === 'POST') {
    const { error, user } = requireAdmin(event);
    if (error) return error;
    try {
      const { name, mobile, email, designation, joiningDate, salary, branchId } = JSON.parse(event.body || '{}');
      if (!name || !mobile) return json(400, { message: 'name and mobile are required' });
      if (!branchId) return json(400, { message: 'branchId is required' });

      const rows = await sql`
        INSERT INTO employees (name, mobile, email, designation, branch_id, joining_date, salary, status)
        VALUES (${name}, ${mobile}, ${email || null}, ${designation || null}, ${branchId},
                ${joiningDate || Math.floor(Date.now() / 1000)}, ${salary || null}, 'Active')
        RETURNING *
      `;
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, logged_at)
        VALUES (${user.sub}, 'Employee Added', 'Employee', ${rows[0].id}, ${name}, ${Math.floor(Date.now() / 1000)})
      `;
      return json(200, rows[0]);
    } catch (err) {
      console.error(err);
      return json(500, { message: 'Server error', detail: String(err) });
    }
  }

  return json(405, { message: 'Method not allowed' });
};
