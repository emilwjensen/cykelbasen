# ADR 0004: Use Neon for application Postgres

Status: Accepted

## Decision

Use Neon Postgres through the official serverless driver. Keep schema changes as
plain SQL migrations and do not introduce an ORM.

Neon Auth handles application authentication. Object storage remains a separate
decision because a Postgres connection is not a file-upload service.

## Reason

The project owner selected Neon and supplied the database connection. The
public marketplace only needs server-rendered reads, so it can ship before auth
and storage credentials exist.

## Consequences

- RLS uses a server-set `app.user_id` bridge from the Neon Auth session.
- The database trigger, not UI state, protects the publication invariant.
- A restricted non-owner role is mandatory before authenticated writes.
- The application uses Neon-only migrations under `db/migrations`.
