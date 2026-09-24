# TriLinkr deployment guide

## 1. Create the database

Provision a PostgreSQL database supported by Vercel/serverless connections. Copy its pooled connection string into `DATABASE_URL`. The application stores all timestamps as UTC and displays attendance using `ORG_TIMEZONE` (default `Asia/Kolkata`).

## 2. Configure environment variables

Set these in local `.env.local` and in the Vercel project settings:

```text
DATABASE_URL=postgresql://...
AUTH_SECRET=<at least 32 random characters>
ADMIN_EMAIL=nages@trilinkr.com
ADMIN_TEMP_PASSWORD=<one-time temporary password>
APP_URL=https://your-vercel-domain.example
ORG_TIMEZONE=Asia/Kolkata
```

Never commit `.env`, `.env.local`, or production credentials.

## 3. Apply migrations

From a trusted deployment environment run:

```bash
npm ci
npm run db:migrate
```

Migrations are explicit and are not executed during application startup.

## 4. Bootstrap the administrator

Run once after migration:

```bash
npm run db:seed
```

The seed is idempotent. The administrator is created with `forcePasswordChange = true`; change the temporary password immediately after the first login.

## 5. Local development

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, AUTH_SECRET, and ADMIN_TEMP_PASSWORD
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## 6. Vercel configuration

Create a Vercel project pointing at this repository. Use the default Next.js build command (`next build`) and keep the Node runtime current. Add the environment variables for Preview and Production separately. Use a pooled/serverless database URL; do not run a long-lived local database connection process.

## 7. Production deployment

Deploy after the migration has succeeded. Vercel builds with `npm run build`. Review the deployment logs for route generation and verify the application can reach PostgreSQL from the deployed region.

## 8. Post-deployment verification

- Log in with the bootstrap admin and complete the forced password change.
- Create and deactivate/reactivate a test member.
- Verify a member cannot open `/team`, `/team-attendance`, or `/audit`.
- Create and assign a task, move it, comment, and verify the recipient notification.
- Check in, check out, and verify the daily total.
- Confirm audit records exist for the above sensitive operations.
