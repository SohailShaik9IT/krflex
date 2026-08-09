const { sql } = require('./utils/db');
const { requireAuth, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };

  const { error, user } = requireAuth(event);
  if (error) return error;

  if (event.httpMethod === 'GET') {
    try {
      const rows = await sql`SELECT * FROM customers ORDER BY created_at DESC`;
      return json(200, rows);
    } catch (err) {
      console.error(err);
      return json(500, { message: 'Server error', detail: String(err) });
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const { name, mobile, email, address, branchId } = JSON.parse(event.body || '{}');
      if (!name || !mobile || !address) return json(400, { message: 'name, mobile, address are required' });

      const now = Math.floor(Date.now() / 1000);
      const rows = await sql`
        INSERT INTO customers (name, mobile, email, address, branch_id, created_at)
        VALUES (${name}, ${mobile}, ${email || null}, ${address}, ${branchId || null}, ${now})
        RETURNING *
      `;
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, logged_at)
        VALUES (${user.sub}, 'Customer Added', 'Customer', ${rows[0].id}, ${name}, ${now})
      `;
      return json(200, rows[0]);
    } catch (err) {
      console.error(err);
      return json(500, { message: 'Server error', detail: String(err) });
    }
  }

  return json(405, { message: 'Method not allowed' });
};
