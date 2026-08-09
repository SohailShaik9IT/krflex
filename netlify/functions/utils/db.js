/**
 * Shared SQL helper for Netlify Functions.
 *
 * Connection string resolution (first match wins):
 *   DATABASE_URL | NETLIFY_DATABASE_URL | NETLIFY_DB_URL | NETLIFY_DATABASE_URL_UNPOOLED
 *
 * - Neon / Netlify cloud hosts → @neondatabase/serverless HTTP driver
 * - Local Postgres (netlify db / localhost) → pg TCP driver
 * Both expose the same tagged-template `sql`...`` API that returns an array of rows.
 */
const { neon } = require('@neondatabase/serverless');

function resolveConnectionStringFromState() {
  try {
    const fs = require('fs');
    const path = require('path');
    const statePath = path.join(process.cwd(), '.netlify', 'state.json');
    if (!fs.existsSync(statePath)) return '';
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return state.dbConnectionString || '';
  } catch {
    return '';
  }
}

function resolveConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DB_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    resolveConnectionStringFromState() ||
    ''
  );
}

function isLocalPostgres(connectionString) {
  try {
    const { hostname } = new URL(connectionString);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function createPgSql(connectionString) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString });

  return async function sql(strings, ...values) {
    let text = '';
    const params = [];
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < values.length) {
        params.push(values[i]);
        text += `$${params.length}`;
      }
    }
    const result = await pool.query(text, params);
    return result.rows;
  };
}

const connectionString = resolveConnectionString();

if (!connectionString) {
  console.warn(
    'No database URL set. Set DATABASE_URL (or NETLIFY_DB_URL) in Netlify env vars or a local .env file.'
  );
}

let sql;
if (!connectionString) {
  sql = async () => {
    throw new Error(
      'No database connection string was provided. Set DATABASE_URL or NETLIFY_DB_URL.'
    );
  };
} else if (isLocalPostgres(connectionString)) {
  sql = createPgSql(connectionString);
} else {
  sql = neon(connectionString);
}

module.exports = { sql, resolveConnectionString };
