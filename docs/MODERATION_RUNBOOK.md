# Moderation runbook

## Provision a moderator

1. The moderator creates an account and completes `/profil`.
2. An operator obtains the Neon Auth user ID from the authenticated account.
3. From an approved administrative environment with the owner `DATABASE_URL`,
   run:

   ```bash
   pnpm db:moderator -- grant AUTH_USER_ID
   ```

4. Ask the moderator to sign out and in again, then verify
   `/admin/dokumentation` and `/admin/rapporter`.

Remove access with:

```bash
pnpm db:moderator -- revoke AUTH_USER_ID
```

The script verifies that the profile exists and never changes an editable role
flag on the public profile.

## Ownership review

1. Confirm that the listing context and seller match the document queue item.
2. Open the private preview. The link is authorized at request time and expires
   after two minutes.
3. Do not download or copy documents unless incident handling requires it.
4. Approve only when the evidence reasonably connects the seller to the bike.
5. Write a concrete review note. The database records moderator, timestamp and
   listing lifecycle atomically.
6. Reject unclear, mismatched or manipulated evidence and explain what the
   seller must replace.

Never share an object path, signed preview URL, raw frame number or document
content in public listing text, forum posts or support channels.

## Reports and incidents

- Hide credible scam or stolen-bike listings while they are investigated.
- Preserve database audit records.
- Escalate suspected theft or threats to the designated platform operator.
- Do not promise law-enforcement outcomes or disclose another user's private
  data.
- Rotate the private Blob token immediately if it may have been exposed.

## Environment safety

- `DATABASE_URL` is an owner credential and belongs only in administrative
  environments.
- Runtime uses `DATABASE_APP_URL`.
- Production must not set `ALLOW_DEVELOPMENT_SEED=true`.
- Public and private Blob stores must use different read-write tokens.
- Preview and production use separate Neon branches and Blob stores.

