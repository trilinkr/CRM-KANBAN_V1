# Final release checklist

## Feature checklist

- [x] TriLinkr-only login domain validation
- [x] Secure session cookie, logout, inactive-user rejection
- [x] Forced first-login password change
- [x] Admin user create/deactivate/reactivate
- [x] Dynamic member/admin dashboards
- [x] Personal board and persisted task creation/movement
- [x] Task assignment, details, comments, and activity history
- [x] Persistent notifications and read state
- [x] Multi-session attendance and daily totals
- [x] Team attendance consolidation
- [x] Server-generated audit events
- [x] Admin attendance correction UI with original values in audit metadata
- [x] Drag/drop client interaction with rollback on failed persistence

## Security checklist

- [x] Argon2id password hashing
- [x] HttpOnly, SameSite=Lax session cookies
- [x] Secure cookies in production
- [x] Server-side role checks on admin operations
- [x] Zod validation on credentials and task/user inputs
- [x] No production secrets committed
- [x] Database constraint preventing duplicate open attendance sessions
- [x] Soft deactivation preserves history

## Test results

- `npm run typecheck` — passed
- `npm run lint` — passed with the ESLint 9 legacy-config deprecation notice
- `npm run test` — passed, 4 unit tests across attendance and validation
- `npm run build` — passed
- Database integration and Playwright journeys require external test database/browser setup.

## Deployment checklist

- [ ] Set Vercel environment variables
- [ ] Run `npm run db:migrate`
- [ ] Run `npm run db:seed`
- [ ] Complete bootstrap admin password change
- [ ] Verify member/admin access boundaries
- [ ] Verify task, notification, attendance, and audit flows

## Environment variables

`DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_TEMP_PASSWORD`, `APP_URL`, and `ORG_TIMEZONE` are documented in `.env.example` and [DEPLOYMENT.md](./DEPLOYMENT.md).

## Known limitations

The database-backed foundation is deployable, but the release should not be called fully production-ready until external-database integration/E2E coverage and final manual browser QA are completed.
