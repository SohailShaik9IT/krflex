const bcrypt = require('bcryptjs');
const { sql } = require('./utils/db');
const { signToken, json, CORS_HEADERS } = require('./utils/auth');

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]?\$/.test(value);
}

function passwordMatches(password, stored) {
  if (!stored) return false;
  if (isBcryptHash(stored)) return bcrypt.compareSync(password, stored);
  // Legacy rows that stored the plaintext password in password_hash
  return password === stored;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { message: 'Method not allowed' });

  try {
    const { username, password } = JSON.parse(event.body || '{}');
    if (!username || !password) return json(400, { message: 'username and password are required' });

    const rows = await sql`SELECT * FROM users WHERE username = ${username}`;
    const user = rows[0];
    if (!user || !passwordMatches(password, user.password_hash)) {
      return json(401, { message: 'Invalid username or password' });
    }

    // Upgrade legacy plaintext password_hash to bcrypt on successful login
    if (!isBcryptHash(user.password_hash)) {
      const hash = bcrypt.hashSync(password, 10);
      await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;
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
