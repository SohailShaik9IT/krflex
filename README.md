# KRFLEX Printing Solutions (Netlify-only build)

Founder: **SMD Quadeer**
Branches: **Guntakal** (Beside Uma Lodge) · **Patikonda** (Beside Police Station)

100% deployable on **Netlify** — static frontend + Netlify Functions (Node.js) — with
**Neon** as the free serverless Postgres database.

## Project layout

```
krflex-netlify/
├── netlify.toml                  # build settings + clean /api/* URL redirects
├── package.json                  # Function dependencies (Neon driver, JWT, bcrypt)
├── database/schema.sql           # Postgres schema (run once against Neon)
├── scripts/seed.js                # creates the admin login (SMD Quadeer)
├── netlify/functions/             # all backend logic (one file = one endpoint)
│   ├── utils/db.js                # shared Neon connection
│   ├── utils/auth.js              # shared JWT + CORS helpers
│   ├── auth-login.js / auth-register.js
│   ├── dashboard.js
│   ├── materials.js / materials-adjust.js
│   ├── customers.js / customer-orders.js
│   ├── orders.js / order-status.js
│   ├── activity-logs.js / order-status-summary.js
│   ├── hr-employees.js / hr-attendance.js / hr-attendance-today.js
│   └── branches.js
└── public/                        # static frontend (what Netlify serves)
    ├── index.html                 # login screen
    ├── dashboard.html
    ├── material-stock.html
    ├── customers.html
    ├── orders.html
    ├── activity-logs.html
    ├── me.html                    # HR portal (visible to both User and Admin)
    ├── css/style.css
    └── js/api.js, shell.js
```

## Logins

Seed once via `node scripts/seed.js` (see DEPLOY_NETLIFY.md):
- **Username:** `admin`
- **Password:** `Admin@123`
- **Role:** Admin (SMD Quadeer)

- **Admin** sees: Dashboard, Material Stock, Customers, Orders, Activity & Logs, Me (HR)
- **User** sees: Me (HR) only — extend `public/js/shell.js`'s `renderSidebar()` if Users
  should see more tabs.

## Run locally before deploying

```bash
npm install -g netlify-cli
npm install
export DATABASE_URL="postgresql://...your-neon-connection-string..."
export JWT_SECRET="some-long-random-string"
netlify dev
```

`netlify dev` runs both the static site and the Functions locally at `http://localhost:8888`,
proxying `/api/*` exactly like production.

**Full step-by-step deployment (Neon setup, GitHub push, Netlify import, env vars) is in
`DEPLOY_NETLIFY.md`.**
