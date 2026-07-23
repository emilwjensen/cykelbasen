# Codex kickoff prompt

Use this prompt for the next vertical slice:

```text
Complete the ownership-document review and publication workflow.

Read AGENTS.md and all files in docs before changing code. Keep Next.js App
Router, TypeScript, Tailwind CSS, Neon Postgres, SQL migrations, Neon Auth and
pnpm. Do not add an ORM or another backend.

Implement:
1. Record the external object-storage decision before adding file bytes.
2. Upload ownership evidence through a short-lived, private scoped URL.
3. Let the seller submit a complete draft for review.
4. Give moderators a private queue with signed document previews.
5. Approve or reject atomically and publish only after approval.
6. Add file validation, rate limits, RLS tests and Danish UI states.

Do not build real-time chat, payment, quiz or automated document analysis.

Before finishing, run lint, typecheck, build and security tests.
```
