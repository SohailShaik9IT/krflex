const { neon } = require('@neondatabase/serverless');

// DATABASE_URL is set in Netlify's environment variables (or auto-set if you
// use the Netlify DB / Neon extension from the Netlify dashboard).
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Set it in Netlify site settings -> Environment variables.');
}

const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
