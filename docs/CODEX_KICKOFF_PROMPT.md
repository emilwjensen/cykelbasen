# Codex kickoff prompt

Use this prompt for the next vertical slice:

```text
Complete forum reporting and moderation.

Read AGENTS.md and all files in docs before changing code. Keep Next.js App
Router, TypeScript, Tailwind CSS, Neon Postgres, SQL migrations, Neon Auth and
pnpm. Do not add an ORM or another backend.

Implement:
1. Report a forum post or comment once per authenticated user.
2. Moderator-only report queue backed by the moderators table.
3. Hide a reported post or comment without deleting its audit context.
4. Record moderator, reason and timestamps.
5. RLS tests for reporter, other user and moderator access.
6. Loading, empty and error states in Danish.

Do not build chat, payment, quiz, document review or file uploads yet.

Before finishing, run lint, typecheck, build and security tests.
```
