# ADR 0005: Neon Auth with a restricted runtime role

Status: Accepted

## Decision

Use the official Neon Auth Next.js SDK for sessions and auth routes. Create a
separate `cykelbasen_app` database login for runtime queries.

Every user-scoped transaction sets `app.user_id` locally from the authenticated
server session. PostgreSQL RLS policies use that value for owner and moderator
authorization.

## Reason

The browser never receives a database credential, while authorization remains
enforced by Postgres rather than UI checks. The migration owner credential does
not need to be used for normal runtime access.

## Consequences

- `.env` needs `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` and
  `DATABASE_APP_URL`.
- `pnpm db:setup-app-role` creates or rotates the restricted login password
  without printing it.
- Authenticated server components are rendered dynamically.
- `pnpm test:security` proves owner isolation and the publication trigger.
