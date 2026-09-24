# TriLinkr Workspace — V1 Product Specification

## Scope

V1 is an internal work-management product, not a CRM. It includes authentication, admin/member management, personal Kanban boards, tasks and assignment, notifications, multi-session attendance, admin attendance consolidation, audit logs, and responsive dashboards. Leads, companies, opportunities, recruitment, invoicing, and customer management are explicitly out of scope.

## Users and roles

Only active users with `@trilinkr.com` emails can log in. Roles are ADMIN and MEMBER. The initial admin is configured through `ADMIN_EMAIL` and `ADMIN_TEMP_PASSWORD`; no production password is committed. Temporary accounts must change their password on first login.

## Functional requirements

Members have a customizable personal board, can create and manage tasks, assign tasks to teammates, comment, view assigned-by-me work, and use persistent notifications. A task move updates column and stable position atomically and creates an audit event.

Attendance supports multiple non-overlapping sessions per day, server timestamps, open-session live totals, midnight-crossing sessions, check-in/check-out guards, history, and admin correction with reason and preserved audit history. Admins can manage users, view consolidated attendance, inspect logs, and configure system settings.

## Non-functional requirements

Responsive SaaS-style UI, server-side authorization, secure password hashing, HttpOnly sessions, validation, no secrets in source, UTC persistence, Vercel compatibility, proper migrations, and automated unit/E2E coverage.

## Phase 1 acceptance

Architecture, product requirements, schema/migrations, auth/RBAC foundation, environment contract, design system, reusable shell, and test infrastructure are established and pass typecheck, lint, tests, and production build. Phase 2 completes the full CRUD board, task, notification, attendance, and admin workflow surfaces on this foundation.
