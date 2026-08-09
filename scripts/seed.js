/**
 * One-time setup script: creates the admin login (SMD Quadeer).
 * Run locally after applying database/schema.sql:
 *
 *   DATABASE_URL="postgresql://..." node scripts/seed.js
 *
 * Change ADMIN_PASSWORD below (or pass via env var) before running in production.
 */
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set DATABASE_URL before running this script.');
  process.exit(1);
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'SMD Quadeer';

async function main() {
  const sql = neon(DATABASE_URL);

  const existing = await sql`SELECT id FROM users WHERE username = ${ADMIN_USERNAME}`;
  if (existing.length > 0) {
    console.log(`User '${ADMIN_USERNAME}' already exists. Nothing to do.`);
    return;
  }

  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  const now = Math.floor(Date.now() / 1000);

  const rows = await sql`
    INSERT INTO users (username, password_hash, full_name, role, branch_id, created_at)
    VALUES (${ADMIN_USERNAME}, ${hash}, ${ADMIN_FULL_NAME}, 'Admin', NULL, ${now})
    RETURNING id, username, full_name, role
  `;

  console.log('Admin user created:', rows[0]);
  console.log(`Login with username="${ADMIN_USERNAME}" password="${ADMIN_PASSWORD}" - change this password after first login.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
