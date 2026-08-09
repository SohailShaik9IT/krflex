const bcrypt = require('bcryptjs');
const { sql } = require('./utils/db');
const { requireAdmin, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { message: 'Method not allowed' });

  const { error } = requireAdmin(event);
  if (error) return error;

  try {
    const { username, password, fullName, role, branchId } = JSON.parse(event.body || '{}');
    if (!username || !password || !fullName || !role) {
      return json(400, { message: 'username, password, fullName, role are required' });
    }

    const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existing.length > 0) return json(400, { message: 'Username already exists' });

    const hash = bcrypt.hashSync(password, 10);
    const now = Math.floor(Date.now() / 1000);
    const rows = await sql`
      INSERT INTO users (username, password_hash, full_name, role, branch_id, created_at)
      VALUES (${username}, ${hash}, ${fullName}, ${role}, ${branchId || null}, ${now})
      RETURNING id, username, role
    `;
    return json(200, rows[0]);
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
