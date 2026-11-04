# Netlify deployment

The site deploys to Netlify with no extra services:

- **Website:** `index.html`, `style.css` and `app.js` are copied to `dist/` by `scripts/prepare-netlify-public.js`. Server code is never published.
- **API:** the Express app in `server.js` runs as the `api` Netlify Function. Every `/api/*` request goes there.
- **Data:** all records are stored in Netlify Database (managed Postgres) as one versioned document. If two people save at the same moment, one gets a "try again" message instead of overwriting the other's changes. Netlify creates the tables automatically on deploy.
- **Backups:** manual, automatic (daily, 00:10 Mogadishu time) and pre-restore backups are private files in Netlify Blobs.
- **Monthly closing:** runs automatically after each month ends (Mogadishu time). It locks that month's records until an admin reopens the month.

## First login

1. Deploy, open the site and choose **Create account**. The **first** account created becomes the administrator.
2. After that, public sign-up is closed. Only the admin can enable it again (setting `allowRegistration`).

## Bringing over existing data

Sign in as the new admin, open **Profile → Backups** and use **Restore from file** with your old `data/database.json` (or any earlier backup). This replaces all records, including user accounts, so you then sign in with your old admin account. A pre-restore backup is made automatically first.

## Optional environment variables

- `JWT_SECRET`: the key used to sign login tokens (at least 32 characters). If it isn't set, a random key is generated once and stored in the database.

## Running locally

`npm install` then `npm start`. Locally, data is stored in `data/database.json`. Set `ADMIN_INITIAL_PASSWORD` (12+ characters) to create `admin@maan.com` on first start, or use **Create account**.
