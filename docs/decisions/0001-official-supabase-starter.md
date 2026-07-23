# ADR 0001: Use the official Next.js Supabase example

Status: Superseded by ADR 0004

## Decision

Generate the application from Vercel's `with-supabase` example and add this repository overlay.

## Reason

It gives current App Router and Supabase SSR patterns without importing an unrelated marketplace architecture.

## Consequences

- We own the marketplace and forum domain code.
- We avoid a second ORM and auth provider.
- Upgrades follow Next.js and Supabase documentation more directly.

## Supersession

The project owner selected Neon before the application was bootstrapped. ADR
0004 records the active database decision, and the application was generated
from `create-next-app` instead.
