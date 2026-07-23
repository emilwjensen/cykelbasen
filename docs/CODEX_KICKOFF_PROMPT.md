# Codex kickoff prompt

Use this prompt for the next vertical slice:

```text
Complete favorites and seller listing lifecycle.

Read AGENTS.md and all files in docs before changing code. Keep Next.js App
Router, TypeScript, Tailwind CSS, Neon Postgres, SQL migrations, Neon Auth and
pnpm. Do not add an ORM or another backend.

Implement:
1. Add or remove a published listing as a favorite once per user.
2. Show the authenticated user's favorites.
3. Let a seller mark their own published listing sold or archived.
4. Keep status transitions explicit and enforced in Neon.
5. RLS tests for owner, other user and public visibility.
6. Loading, empty and error states in Danish.

Do not build chat, payment, quiz, document review or file uploads yet.

Before finishing, run lint, typecheck, build and security tests.
```
