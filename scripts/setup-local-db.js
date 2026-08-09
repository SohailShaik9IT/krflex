/**
 * Apply database/schema.sql and seed the admin user against DATABASE_URL.
 * Works with local Netlify DB (pg) and Neon (pg over TLS).
 *
 *   node scripts/setup-local-db.js
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

function resolveDatabaseUrl() {
  const fromEnv =
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DB_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  if (fromEnv) return fromEnv;

  try {
    const statePath = path.join(__dirname, '..', '.netlify', 'state.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return state.dbConnectionString || '';
  } catch {
    return '';
  }
}

const DATABASE_URL = resolveDatabaseUrl();

if (!DATABASE_URL) {
  console.error('Set DATABASE_URL (or NETLIFY_DB_URL), or start `netlify dev` so .netlify/state.json has a local DB URL.');
  process.exit(1);
}

console.log('Using database:', DATABASE_URL.replace(/\/\/([^@/]+@)?/, '//'));

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'smdquadeer@krflex.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ayesha@2017';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'SMD Quadeer';

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: /neon\.(tech|build)/i.test(DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
  });

  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  console.log('Applying schema from database/schema.sql ...');
  try {
    await pool.query(schemaSql);
    console.log('Schema applied.');
  } catch (err) {
    if (err.code === '42P07') {
      console.log('Schema already present — skipping create.');
    } else {
      throw err;
    }
  }

  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [ADMIN_USERNAME]);
  if (existing.rows.length > 0) {
    console.log(`User '${ADMIN_USERNAME}' already exists. Nothing to seed.`);
  } else {
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    const now = Math.floor(Date.now() / 1000);
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role, branch_id, created_at)
       VALUES ($1, $2, $3, 'Admin', NULL, $4)
       RETURNING id, username, full_name, role`,
      [ADMIN_USERNAME, hash, ADMIN_FULL_NAME, now]
    );
    console.log('Admin user created:', rows[0]);
    console.log(`Login with username="${ADMIN_USERNAME}" password="${ADMIN_PASSWORD}"`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
