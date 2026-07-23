# Project status

Last reviewed: 2026-07-23.

## Summary

Cykelbasen is a coherent Neon product with a working public marketplace,
authenticated seller area, private bike ownership area, forum and moderation.
The trust-critical upload code now uses separate public and private Vercel Blob
stores. The repo is ready for environment provisioning and a real
seller-to-moderator test, but is not ready for a public launch yet.

The complete application workflow now includes validated image/document
uploads, image ordering, private short-lived previews, atomic review/publication
and audit. The remaining P0 work is external provisioning and evidence from the
first full browser journey against those real stores.

## Implemented

### Foundation

- Next.js App Router, TypeScript and Tailwind CSS.
- Neon Auth and Neon Postgres with a restricted runtime role.
- SQL migrations, development seed and RLS security test script.
- GitHub Actions quality workflow and Vercel-compatible build.
- Server components by default, server actions and Zod validation for writes.
- Separate public/private Vercel Blob integration with server-only credentials.
- Development-seed production guard and a moderator provisioning script/runbook.
- Sitemap, robots rules, manifest, structured listing data and beta legal pages.

### Marketplace

- Public browse and detail routes for approved, published listings.
- URL-based search, sorting and filters.
- Database pagination with stable ordering and canonical page URLs.
- Brand and frame-size dropdowns, price sliders and precise price fields.
- Active-filter chips with individual removal and clear-all.
- Browser-local selection and shareable side-by-side comparison for up to three
  published listings.
- Structured bike specifications and trust indicators.
- Purchase date, known owner count, purchase proof and service-history markers.
- Structured public component replacement history.
- Authenticated listing drafts and draft editing.
- Seller readiness state and submit-for-review action requiring an image and a
  pending ownership-document record.
- Private moderator document queue with approved and rejected history.
- Atomic ownership approval, listing publication or rejection and lifecycle
  audit.
- Seller dashboard with explicit sold and archived actions.
- Private buyer favorites and a `/favoritter` overview.
- Database-enforced ownership approval before publication.
- Database guard against editing content on active or finished listings.
- Audited seller lifecycle changes.
- Private listing reports with scam/stolen-bike reasons.
- Moderator listing queue with atomic removal and lifecycle audit.
- Structured buyer inquiries with explicit e-mail sharing.
- Private seller inbox with new, read and closed states.
- Buyer overview for sent inquiries and reservation status.
- Private buyer-linked reservation flow with release, sale completion and
  listing lifecycle audit.
- Reserved listings remain visible but pause new inquiries and sort after
  available listings.
- Bike-registration transfers complete matching active reservations.
- Database-enforced rolling rate limits for contact, forum and report writes.
- Validated image upload, order, cover selection and deletion for up to eight
  files.
- Keyboard-accessible public image gallery.
- Private ownership-document upload with optional frame-number hashing.
- Two-minute owner/moderator previews without exposing object paths.
- Upload rate limits and editable-state policies enforced in Postgres.
- Explicit completed-sale confirmation and a direct registered-bike handoff
  from reserved listings.

### Mine cykler

- Private route at `/mine-cykler`.
- Register a bike with an optional one-way hash of its frame number.
- Acquisition history, owner count and odometer.
- Ride, maintenance, inspection, note and component-change logs.
- Date- and odometer-based maintenance plans with overdue and upcoming states.
- Atomic completion of a maintenance task into the private bike log.
- Documentation-presence markers without public document paths.
- Prefill a listing draft from a registered bike.
- Owner isolation through RLS.
- Transfer a bike registration with a single-use, 14-day code.
- Preserve a connected ownership timeline across registered buyers and sellers.
- Keep each owner's notes and logs private after transfer.
- Show privacy-safe ownership periods on connected public listings.

### Forum and moderation

- Categories, post lists, post detail and sorting.
- Create and edit posts.
- Comments and one reply level.
- Private user votes with database-managed aggregate scores.
- Reports for posts and comments.
- Moderator report queue, hide/dismiss actions and audit data.

## Launch blockers

| Priority | Missing capability | Why it blocks launch |
| --- | --- | --- |
| P0 | Provision separate public/private Blob stores and production tokens | Upload code is complete, but this external state cannot be created or verified from the repository alone. |
| P0 | Run the real seller-to-moderator browser journey | The database and build tests pass, but no real file has yet crossed the configured production-like stores. |
| P0 | Name the legal operator and review beta policies | The product pages exist, but company identity, processor terms and final retention periods require an owner/legal decision. |

Object storage remains separate from Neon: Postgres stores metadata, public
images use CDN URLs, and private evidence uses scoped short-lived access.

## Important follow-up work

### Marketplace quality

- Reporter-facing history or receipt page if testing shows a need beyond the
  current confirmation feedback.
- Complete accessibility pass for sliders, all forms, focus states and status
  messages.
- Add generated social images and normalize brand/model suggestions.

### Mine cykler

- Edit, retire and delete a registered bike.
- Edit or remove incorrect log entries with an audit-friendly policy.
- Upload private receipts and service documents after storage is selected.
- Select which bike-log component changes should be copied into a listing.
- Edit/cancel/snooze maintenance reminders and add recurring intervals.

### Reliability and operations

- Extend rate limits to authentication-sensitive actions.
- Browser-level tests for signup, profile, draft, favorite and forum flows.
- Browser-level test for the seller-to-moderator publication path.
- Error tracking, product analytics and database monitoring.
- Finalize retention rules and a self-service user deletion/export process.
- Backup/restore rehearsal and orphaned Blob cleanup.

## Recommended sequence

1. Create and connect the two Vercel Blob stores.
2. Run a real seller-to-moderator publication test and add it to Playwright.
3. Add the remaining browser journeys and accessibility checks.
4. Implement audit-friendly bike/log corrections and account lifecycle.
5. Rehearse operations, then run a closed test with real sellers.

Quiz, payments, escrow, shipping integrations, price estimation and real-time
chat remain deliberately outside the MVP.
