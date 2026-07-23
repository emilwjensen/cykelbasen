# Codex kickoff prompt

Phase 0 and Phase 1 are implemented. Use this prompt for the next slice:

```text
Build Phase 2, the authenticated seller draft flow.

Read AGENTS.md and all files in docs before changing code. Keep Next.js,
TypeScript, Neon Postgres, SQL migrations and pnpm. Do not add an ORM.

Before implementation, configure Neon Auth and decide the object-storage
provider in an ADR. Add a restricted, non-BYPASSRLS application database role
and prove the app.user_id RLS bridge with integration tests.

Implement:
1. Sign up, sign in and profile completion.
2. Create and edit a draft listing with server-side Zod validation.
3. Seller dashboard for own drafts.
4. Listing-image upload to the selected public storage namespace.
5. Reorder and delete images.
6. Empty, loading and error states in Danish.

Do not build chat, payment, quiz, document review or forum yet.

Before finishing, run lint, typecheck, build and the new RLS tests.
```

