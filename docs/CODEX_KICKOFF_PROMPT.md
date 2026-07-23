# Codex kickoff prompt

Use this prompt for the next vertical slice:

```text
Select and integrate object storage for listing images and ownership documents.

Read AGENTS.md and all files in docs before changing code. Keep Next.js App
Router, TypeScript, Tailwind CSS, Neon Postgres, SQL migrations, Neon Auth and
pnpm. Do not add an ORM or another backend.

Implement:
1. Record the provider and security decision in an ADR.
2. Upload listing images through short-lived scoped URLs and store public/CDN
   metadata in listing_images.
3. Support image order, cover selection and deletion.
4. Upload ownership evidence to a separate private namespace.
5. Add short-lived signed previews to the existing moderator document queue.
6. Validate MIME type, file signature, size and ownership server-side.
7. Add database-backed upload limits, authorization tests and Danish UI states.

Do not build real-time chat, payment, quiz or automated document analysis.

Before finishing, run lint, typecheck, build and security tests.
```
