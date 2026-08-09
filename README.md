# KRFLEX Printing Solutions

Internal operations app for **KRFLEX Printing Solutions** — manage material stock, customers, orders, activity logs, and HR attendance across two branches.

**Founder:** SMD Quadeer  
**Branches:** Guntakal (Beside Uma Lodge) · Patikonda (Beside Police Station)

**Stack:** Netlify (static UI + serverless Functions) · Neon Postgres · JWT auth

**Live repo:** [github.com/SohailShaik9IT/krflex](https://github.com/SohailShaik9IT/krflex)

---

## Features

| Module | What it does |
|---|---|
| **Dashboard** | Daily / weekly / monthly / yearly business overview |
| **Material Stock** | Track inventory and adjust quantities |
| **Customers** | Customer records and per-customer order tracking |
| **Orders** | Create orders and update status (In Progress → Completed → Delivered) |
| **Activity & Logs** | Audit trail and order-status summaries |
| **Me (HR)** | Employees and daily attendance by branch |
| **Auth** | Login, logout, forced password change, role-based API protection |

---

## Project layout

```
krflex/
├── netlify.toml                 # build + /api/* → Functions redirects
├── package.json                 # Neon, JWT, bcrypt
├── database/
│   ├── schema.sql               # Postgres schema (run once on Neon)
│   └── migrate-updates.sql      # incremental migrations
├── scripts/
│   ├── seed.js                  # creates the initial admin user
│   └── setup-local-db.js        # local DB helper
├── netlify/functions/           # one file ≈ one API endpoint
│   ├── utils/                   # db, auth, validate helpers
│   ├── auth-*.js                # login, logout, register, change-password, my-activity
│   ├── dashboard.js / branches.js
│   ├── materials*.js / customers*.js / orders*.js
│   ├── activity-logs.js / order-status-summary.js
│   └── hr-*.js                  # employees + attendance
└── public/                      # static frontend
    ├── index.html               # login
    ├── change-password.html
    ├── dashboard.html / material-stock.html / customers.html
    ├── orders.html / activity-logs.html / me.html
    ├── css/style.css
    └── js/api.js, shell.js
```

---

## Tech overview

```
Browser (public/*.html + js/api.js)
        │  fetch('/api/...')
        ▼
netlify.toml redirects  →  /.netlify/functions/<name>.js
        │
        ▼
Netlify Function (Node.js) → JWT check → Neon Postgres
```

---

## Quick start (local)

```bash
npm install -g netlify-cli
npm install

# Windows PowerShell
$env:DATABASE_URL = "postgresql://...your-neon-connection-string..."
$env:JWT_SECRET   = "a-long-random-secret"

# Apply schema (or paste database/schema.sql into Neon SQL Editor)
# psql "$DATABASE_URL" -f database/schema.sql

node scripts/seed.js
netlify dev
```

Open [http://localhost:8888](http://localhost:8888).

Admin credentials are created by `scripts/seed.js` — change the password on first login (`change-password.html` is enforced when required).

---

## Deploy (Netlify + Neon)

1. Create a Neon Postgres project (or enable **Netlify DB / Neon** in Netlify Extensions).
2. Run `database/schema.sql` against Neon, then `node scripts/seed.js`.
3. Push this repo to GitHub and import it in Netlify.
4. Set environment variables on the site:

| Key | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | Long random string (32+ chars) |

5. Deploy. Build settings come from `netlify.toml` (`public` + `netlify/functions`).

Full walkthrough: **[DEPLOY_NETLIFY.md](./DEPLOY_NETLIFY.md)**.

---

## Roles

- **Admin** — full access to dashboard, stock, customers, orders, logs, and HR.
- **User** — authenticated access; sensitive actions remain API-protected for Admin.

---

## Security notes

- Change the seeded admin password immediately after first login.
- Keep `JWT_SECRET` strong and private (never commit it).
- Prefer locking CORS to your Netlify site URL once deployed (see `netlify/functions/utils/auth.js`).
