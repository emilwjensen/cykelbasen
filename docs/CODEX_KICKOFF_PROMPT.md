# Codex kickoff prompt

Use this prompt for the next vertical slice:

```text
Complete the image portion of Phase 2.

Read AGENTS.md and all files in docs before changing code. Keep Next.js,
TypeScript, Neon Postgres, SQL migrations, Neon Auth and pnpm. Do not add an
ORM.

Start by recording an ADR for the object-storage provider. Listing images must
be public, while the later ownership-document namespace must remain private.

Implement:
1. Direct, scoped image upload for an authenticated listing owner.
2. Server-side MIME type, file size and ownership validation.
3. Store image metadata in listing_images.
4. Reorder and delete images.
5. Cover-image preview in mine annoncer and the public listing card.
6. Loading, empty and error states in Danish.

Do not build chat, payment, quiz, document review or forum yet.

Before finishing, run lint, typecheck, build and security tests.
```

