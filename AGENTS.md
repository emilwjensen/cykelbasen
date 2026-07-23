# Project instructions

## Product

Build a trustworthy Danish marketplace and forum for used race bikes. Keep listing creation simple. Structured specs, ownership verification, useful filters and clear moderation are more important than feature count.

Read these files before changing product behavior:

- `docs/PRODUCT_BRIEF.md`
- `docs/MVP_SCOPE.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`

## Stack rules

- Use Next.js App Router and TypeScript for the frontend.
- Use Tailwind CSS for styling.
- Use Neon Postgres and Row Level Security.
- Use Neon Auth when authentication is introduced.
- Use the Neon serverless driver and explicit typed SQL. Do not add an ORM.
- Object storage is a separate service; record the provider decision before implementing uploads.
- Use server components by default.
- Add client components only for browser state or interaction.
- Validate writes with Zod on the server.
- Use server actions for normal application writes.
- Never expose `DATABASE_URL`, an owner role or private storage credentials to the browser.
- Do not add Prisma, Drizzle, Clerk, NextAuth or a second backend.
- Use pnpm.

## Database rules

- Every schema change must be a migration in `db/migrations`.
- Every user-owned table must enable RLS in the migration that creates it.
- Sensitive ownership data and documents must remain private.
- Public listing data must never include the full frame number or document path.
- Add indexes for real filter and sort paths.
- Update the explicit TypeScript query result types after migrations.

## Implementation rules

- Implement one vertical slice at a time.
- Do not create generic abstractions before two real use cases exist.
- Keep specs explicit and searchable. Do not hide core filters in JSONB.
- Use URL search parameters for listing filters and sorting.
- Preserve filters when navigating back from a listing.
- Show empty, loading and error states.
- Use Danish UI copy unless a task says otherwise.

## Security rules

- Treat RLS as the authorization layer. UI checks are not authorization.
- Ownership documents use private object storage and signed URLs.
- Listing images use a separate public object-storage namespace.
- Use `DATABASE_URL` only for migrations and administrative scripts.
- Runtime queries use `DATABASE_APP_URL`, the restricted non-`BYPASSRLS` role.
- Set the authenticated user context locally in every user-scoped transaction.
- A seller cannot publish a listing without an approved ownership document.
- Moderation actions require a moderator record in the database.
- Rate-limit public write endpoints before launch.

## Quality gate

Before finishing a coding task:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Run relevant tests when they exist. Summarize changed files, migrations, commands run and unresolved risks.
