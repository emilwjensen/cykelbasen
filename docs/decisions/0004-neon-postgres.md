# ADR 0004: Use Neon for application Postgres

Status: Accepted

## Decision

Use Neon Postgres through the official serverless driver. Keep schema changes as
plain SQL migrations and do not introduce an ORM.

Neon Auth is the intended authentication system for the seller slice, but it is
not enabled by `DATABASE_URL` alone. Object storage is a separate decision
because a Postgres connection is not a file-upload service.

## Reason

The project owner selected Neon and supplied the database connection. The
public marketplace only needs server-rendered reads, so it can ship before auth
and storage credentials exist.

## Consequences

- Supabase-specific auth functions, roles and storage tables are not part of
  the active migration.
- RLS uses a server-set `app.user_id` bridge until Neon Auth/Data API integration
  is finalized.
- The database trigger, not UI state, protects the publication invariant.
- A restricted non-owner role is mandatory before authenticated writes.
- The legacy Supabase overlay is retained under `legacy/` for reference only.
