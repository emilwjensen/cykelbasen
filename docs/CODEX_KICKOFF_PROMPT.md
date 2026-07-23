# Codex kickoff prompt

Use this prompt for the next vertical slice:

```text
Continue launch hardening after the Vercel Blob upload slice.

Read AGENTS.md and all files in docs before changing code. Keep Next.js App
Router, TypeScript, Tailwind CSS, Neon Postgres, SQL migrations, Neon Auth and
pnpm. Do not add an ORM or another backend.

Implement:
1. Provision and verify separate public/private Vercel Blob environments.
2. Add Playwright journeys for seller upload, moderator review and publication.
3. Implement audit-friendly bike/log corrections and retirement.
4. Complete account export/deletion and retention operations.
5. Add error monitoring, backup rehearsal and notification delivery.
6. Preserve the current Neon RLS and atomic lifecycle workflows.

Do not build real-time chat, payment, quiz or automated document analysis.

Before finishing, run lint, typecheck, build and security tests.
```
