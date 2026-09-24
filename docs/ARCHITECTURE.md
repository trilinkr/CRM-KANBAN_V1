# TriLinkr Workspace — Architecture

## Existing architecture audit

The repository was empty at audit time: there was no package manifest, lockfile, application source, database schema, migration history, authentication, test setup, or deployment configuration. There was therefore no working infrastructure to preserve and no legacy migration burden.

## Recommended architecture

Next.js 15 App Router runs the UI and server-side application boundary. Server Actions and Route Handlers own mutations; authorization is performed again inside every mutation. PostgreSQL is accessed through Drizzle ORM using the serverless-compatible `postgres` driver. Zod validates environment variables and request payloads. Argon2id hashes credentials. Sessions are signed, opaque cookie values backed by the database.

## Technology decisions

- Tailwind CSS, Lucide, and small local UI primitives keep the visual system cohesive without a large component dependency.
- dnd-kit is reserved for the interactive board surface.
- UTC is used for stored timestamps; organization timezone is display-only.
- Soft deactivation preserves historical task and attendance relationships.

## Folder structure

`src/app` contains routes and layouts; `src/components` contains reusable UI; `src/lib` contains auth, validation, permissions, and domain helpers; `src/db` contains schema, migrations, and bootstrap scripts; `tests` contains unit and end-to-end coverage.

## Database architecture

Normalized tables cover users, sessions, boards, columns, tasks, comments, notifications, attendance sessions, and audit events. Foreign keys use restrictive or cascading behavior intentionally; indexes cover login, task retrieval, notification inboxes, attendance reports, and audit queries. Attendance is session-based so daily totals are sums, never first-in/last-out subtraction.

## Authentication and authorization

Only `@trilinkr.com` addresses pass server-side validation. Login creates a random session token whose hash is stored in the database; the raw value is HttpOnly, Secure in production, SameSite=Lax, and short-lived. The database user record is the role authority. Admin-only functions use `requireAdmin()` and never trust client role or user IDs.

## Deployment

Vercel hosts the Next.js application. A managed Postgres provider supplies `DATABASE_URL`. Migrations run in CI/deployment, never on application startup. `npm run db:seed` is an explicit bootstrap command using `ADMIN_EMAIL` and `ADMIN_TEMP_PASSWORD`.

## Testing strategy

Vitest covers pure validation and attendance calculations. Integration tests should exercise authorization and transactional mutations against a disposable Postgres database. Playwright covers login, password change, board movement, attendance session rules, and admin route denial. The current implementation has the unit harness and production build wired; database-backed integration and browser suites require deployment/test database credentials.

## Migration strategy

The generated first migration creates the complete V1 schema. Future CRM modules should add bounded tables and services without coupling themselves to board or attendance records. Existing audit and user IDs remain stable; deactivation is preferred over deletion.
