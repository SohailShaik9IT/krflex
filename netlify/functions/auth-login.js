const bcrypt = require('bcryptjs');
const { sql } = require('./utils/db');
const { signToken, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { message: 'Method not allowed' });

  try {
    const { username, password } = JSON.parse(event.body || '{}');
    if (!username || !password) return json(400, { message: 'username and password are required' });

    const rows = await sql`SELECT * FROM users WHERE username = ${username}`;
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return json(401, { message: 'Invalid username or password' });
    }

    const token = signToken(user);
    return json(200, {
      token,
      role: user.role,
      fullName: user.full_name,
      userId: user.id,
    });
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
