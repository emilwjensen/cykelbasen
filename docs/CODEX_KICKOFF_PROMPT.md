# Codex kickoff prompt

Use this prompt for the next vertical slice:

```text
Complete minimal buyer contact requests and write rate limiting.

Read AGENTS.md and all files in docs before changing code. Keep Next.js App
Router, TypeScript, Tailwind CSS, Neon Postgres, SQL migrations, Neon Auth and
pnpm. Do not add an ORM or another backend.

Implement:
1. Let an authenticated buyer send a structured contact request on a listing.
2. Keep seller e-mail private and avoid real-time chat.
3. Give the seller an inbox-style overview of contact requests.
4. Add database-backed rate limits for contact, forum and report writes.
5. Preserve RLS isolation and add abuse-oriented security tests.
6. Include loading, empty and error states in Danish.

Do not build real-time chat, payment, quiz, document review or file uploads yet.

Before finishing, run lint, typecheck, build and security tests.
```
