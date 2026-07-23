# Open-source reuse review

Reviewed on 2026-07-23. Re-check licenses and current code before copying.

## Adopted foundation

### Next.js create-next-app

Source: <https://nextjs.org/docs/app/api-reference/cli/create-next-app>

Used for the App Router, TypeScript, ESLint, Tailwind and standard Vercel
conventions.

### Neon serverless driver

Source: <https://github.com/neondatabase/serverless>

Used for server-only, parameterized SQL queries against Neon Postgres. Schema
ownership stays in plain SQL migrations.

### Neon Auth

Source: <https://neon.com/docs/auth/quick-start/nextjs>

Used for application sessions, account creation, login and logout.

## Candidate libraries

### shadcn/ui

Source: <https://github.com/shadcn-ui/ui>

May be added component-by-component when interactive forms need it. Do not
import a complete starter or a second application architecture.

## Reference only

Generic marketplace and forum clones may inform layout or entity ideas, but
must not be copied as foundations. Before copying isolated code, record:

- license and source commit
- framework and dependency health
- security and authorization assumptions
- exact files or concepts reused

Do not introduce GPL or AGPL code without a deliberate licensing decision.
