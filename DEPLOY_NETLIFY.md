# KRFLEX Printing Solutions — Deploy on Netlify Only

Everything in this build runs on **Netlify** (static site + serverless Functions) plus
**Neon** for Postgres (Neon is a serverless Postgres provider — it's the same database engine
that powers Netlify's own "Netlify DB" add-on, so it plugs in natively).

No .NET, no Streamlit, no separate app host. Just Netlify + one free database.

---

## 1. Create the free Postgres database (Neon)

**Option A — via Netlify itself (easiest):**
1. In your Netlify site dashboard → **Extensions** (or **Integrations**) → search **Neon** →
   **Netlify DB** → **Add**.
2. It provisions a free Neon Postgres database and automatically sets a `DATABASE_URL`
   (or `NETLIFY_DATABASE_URL`) environment variable on your site. If it names the variable
   differently, just add a second env var named `DATABASE_URL` with the same value (Site
   settings → Environment variables).

**Option B — directly on Neon:**
1. Go to https://neon.tech → sign up free → **Create a project** (name it `krflex`).
2. Copy the **connection string** shown (starts with `postgresql://...`).
3. You'll paste this into Netlify's environment variables in Step 3.

## 2. Load the schema and seed the admin login

From your own computer (needs Node.js installed):

```bash
# 1. Point at your Neon database
export DATABASE_URL="postgresql://...your-neon-connection-string..."

# 2. Apply the schema (needs the 'psql' CLI - or paste schema.sql into Neon's SQL editor
#    at https://console.neon.tech, which works with zero local setup)
psql "$DATABASE_URL" -f database/schema.sql

# 3. Create the admin login (SMD Quadeer)
npm install
node scripts/seed.js
```

This creates `username: admin`, `password: Admin@123`. **Change this password** after your
first login (use `POST /api/auth/register` while logged in as admin to create a new admin
account, then remove/disable the seeded one directly in the `users` table).

> No `psql` installed? Just open the Neon **SQL Editor** in your browser, paste the contents
> of `database/schema.sql`, and run it. Then run `node scripts/seed.js` locally (only needs
> `DATABASE_URL` set) to create the admin login.

## 3. Push this project to GitHub

```bash
cd krflex-netlify
git init
git add .
git commit -m "KRFLEX Printing Solutions"
git branch -M main
git remote add origin https://github.com/<your-username>/krflex-printing-solutions.git
git push -u origin main
```

## 4. Deploy on Netlify

1. Go to https://app.netlify.com → **Add new site** → **Import an existing project**.
2. Connect GitHub → pick your `krflex-printing-solutions` repo.
3. Build settings are already defined in `netlify.toml`:
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
   - Build command: `npm install`
4. Before the first deploy (or right after), go to **Site settings → Environment variables**
   and add:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | your Neon connection string (skip if the Netlify DB integration already set it) |
   | `JWT_SECRET` | a long random string (32+ characters) — used to sign login tokens |
5. Click **Deploy site**. Netlify builds and gives you a URL like
   `https://krflex-printing-solutions.netlify.app`.

## 5. Test it

1. Open your Netlify URL → you'll land on the login screen.
2. Log in with `admin` / `Admin@123`.
3. Try each tab: Dashboard (switch Daily/Weekly/Monthly/Yearly), Material Stock (add a
   material, use +/-), Customers (add one, click their name to see the order tracker),
   Orders (add an order, change its status to Delivered), Activity & Logs, and Me (HR).

## 6. Security follow-ups before real use

- Change the seeded admin password immediately (create a fresh admin via `/api/auth/register`,
  then remove the old row from the `users` table in Neon's SQL editor).
- Set a strong random `JWT_SECRET` in Netlify's environment variables (don't leave the default).
- In `netlify/functions/utils/auth.js`, the CORS header is currently `*` (open) to make first
  deployment easy — once your Netlify URL is live, change
  `'Access-Control-Allow-Origin': '*'` to your exact site URL for tighter security.
- Netlify Functions on the free tier have execution limits (125k requests/month, 100 hours
  compute/month) — plenty for a small print shop's internal tool.

## How the pieces fit together

```
Browser (public/*.html + js/api.js)
        │  fetch('/api/...')
        ▼
netlify.toml redirects  →  /.netlify/functions/<name>.js
        │
        ▼
Netlify Function (Node.js) → verifies JWT → queries Neon Postgres via @neondatabase/serverless
        │
        ▼
Neon Postgres (branches, users, employees, attendance, customers,
               material_stock, orders, activity_logs)
```

Every screen from the original spec maps directly to a function:

| Screen | Functions |
|---|---|
| Dashboard | `dashboard.js` |
| Material Stock | `materials.js`, `materials-adjust.js` |
| Customers | `customers.js`, `customer-orders.js` |
| Orders | `orders.js`, `order-status.js` |
| Activity & Logs | `activity-logs.js`, `order-status-summary.js` |
| Me (HR) | `hr-employees.js`, `hr-attendance.js`, `hr-attendance-today.js` |
| Login | `auth-login.js`, `auth-register.js` |
