const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_NETLIFY_ENV_VARS';
const JWT_EXPIRY = '8h';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, fullName: user.full_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function verifyToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // tighten to your Netlify domain after first deploy
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function requireAuth(event) {
  const user = verifyToken(event);
  if (!user) return { error: json(401, { message: 'Unauthorized' }) };
  return { user };
}

function requireAdmin(event) {
  const { user, error } = requireAuth(event);
  if (error) return { error };
  if (user.role !== 'Admin') return { error: json(403, { message: 'Admin role required' }) };
  return { user };
}

module.exports = { signToken, verifyToken, requireAuth, requireAdmin, json, CORS_HEADERS };
