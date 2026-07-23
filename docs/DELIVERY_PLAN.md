# Delivery plan

Last updated: 2026-07-23.

This plan turns the product audit into vertical slices. Each slice must preserve
RLS as the authorization layer and finish with lint, typecheck, build and
relevant security or browser tests.

## Release 1: trustworthy closed beta

### Slice 1. Real listing media

Status: in progress.

- Select and document the object-storage provider.
- Create a separate public image store and private document store.
- Validate file size, media type and file signature on the server.
- Upload up to eight listing images.
- Reorder images and use the first image as cover.
- Delete image metadata and the corresponding object.
- Show all images in a keyboard-accessible listing gallery.
- Add database-enforced image limits, editable-state checks and upload rate
  limits.

Exit evidence: a seller can manage real images without database or storage
console access, and an active listing cannot be modified through the runtime
role.

### Slice 2. Ownership evidence

Status: in progress.

- Upload PDF or image evidence to private storage.
- Optionally hash a frame number without storing its raw value.
- Replace pending or rejected evidence while the listing is editable.
- Open a short-lived preview only after an owner/moderator authorization check.
- Keep object paths and review notes out of public queries.
- Preserve the atomic review and publication workflow.

Exit evidence: a seller uploads evidence and a moderator can inspect and decide
it without Neon or storage-console access.

### Slice 3. Production moderation and seed safety

Status: planned.

- Add an owner-credential script for granting and revoking moderator access.
- Require an explicit development-only confirmation before running seed data.
- Document moderator onboarding, document handling and incident escalation.
- Separate preview, staging and production environment values.

Exit evidence: an operator can provision a real moderator without ad hoc SQL,
and development seed cannot run accidentally in production.

### Slice 4. Critical browser journeys

Status: planned.

- Add Playwright with isolated test users and deterministic data setup.
- Cover signup, profile completion and login return destination.
- Cover draft, images, document submission, moderation and publication.
- Cover browse, filter, favorite, contact, reservation and release.
- Cover forum post, comment and vote.
- Cover bike registration, log, reminder and transfer.
- Run browser smoke tests against preview deployments and the full suite in a
  dedicated test environment.

Exit evidence: the MVP success criteria in `MVP_SCOPE.md` pass without manual
database intervention.

## Release 2: safe public beta

### Slice 5. Sale and ownership handoff

- Present the reserved buyer and linked registered bike in one seller flow.
- Require an explicit sale confirmation.
- Generate the ownership-transfer handoff from the completed sale when both
  parties opt into registration.
- Keep a supported “sold without platform transfer” path.
- Add reservation expiry, reminders and manual extension.
- Notify seller and buyer about inquiry, reservation, release and completed
  handoff.

### Slice 6. Durable bike data

- Edit bike identity and non-historical metadata.
- Retire a bike without erasing its ownership chain.
- Correct logs through an append-only revision audit.
- Cancel, edit and snooze open maintenance reminders.
- Add recurring service intervals.
- Select which component changes are copied into a sales listing.
- Add private receipts and service documents using the private store.

### Slice 7. Privacy and account lifecycle

- Publish Danish privacy and terms pages after legal review.
- Define retention periods for inquiries, reports and ownership documents.
- Export account, listing and private bike data.
- Delete or anonymize an account without corrupting ownership/audit history.
- Record processor, region and deletion obligations for Neon, Vercel and mail.

### Slice 8. Reliability and abuse resistance

- Add authentication-sensitive limits and upload quotas.
- Add error tracking with secret and personal-data scrubbing.
- Add product analytics for funnel events without private document data.
- Configure database metrics, alerts and slow-query review.
- Rehearse Neon restore and Blob object recovery.
- Add orphan-object cleanup and failed-upload reconciliation.
- Document incident response and moderator audit review.

## Release 3: marketplace growth

### Slice 9. Discovery and listing quality

- Canonical brand/model suggestions while retaining an “other” value.
- Better city/region facets and saved searches.
- Structured data, sitemap, robots rules and social images.
- Seller preview before submission.
- Reporter receipt/history.
- Availability reminders and stale-listing confirmation.

### Slice 10. Engagement

- Optional guided bike quiz that resolves to existing marketplace filters.
- Notification preferences and digest e-mails.
- Better forum search, following and solved-answer markers.
- Maintenance trends and cost summaries for “Mine cykler”.

## Explicitly deferred

Payments, escrow, shipping integrations, direct chat, automated document
analysis, stolen-bike registry integration, dealer accounts, price prediction
and a native mobile app remain outside the first public beta.

