# Project status

Last reviewed: 2026-07-23.

## Summary

Cykelbasen is a coherent, Neon-only product prototype with a working public
marketplace, authenticated seller area, private bike ownership area, forum and
moderation. It is not launch-ready yet because the trust-critical image and
private-document uploads still need an external object-storage provider.

The application-side ownership workflow is complete: a seller submits a ready
draft, a moderator approves or rejects the private document record, and the
database atomically publishes or rejects the listing with an audit trail. The
remaining P0 work is to attach real file bytes and signed document previews to
that workflow.

## Implemented

### Foundation

- Next.js App Router, TypeScript and Tailwind CSS.
- Neon Auth and Neon Postgres with a restricted runtime role.
- SQL migrations, development seed and RLS security test script.
- GitHub Actions quality workflow and Vercel-compatible build.
- Server components by default, server actions and Zod validation for writes.

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
| P0 | Public listing-image upload, order and deletion | Sellers cannot create a credible real listing without seeded image URLs. |
| P0 | Private ownership-document upload and signed moderator preview | The review workflow exists, but a seller cannot attach real evidence and a moderator cannot inspect its bytes yet. |
| P0 | Production moderation bootstrap and operating procedure | A real moderator must be provisioned without ad hoc production SQL. |

Object storage is intentionally not replaced by Neon: Postgres stores metadata,
while image and document bytes require an external storage provider. Listing
images must be public or CDN-delivered; ownership documents must remain private
and use short-lived signed access.

## Important follow-up work

### Marketplace quality

- Listing image gallery when upload exists.
- Preserve an intended destination through login.
- Reporter-facing history or receipt page if testing shows a need beyond the
  current confirmation feedback.
- Broader SEO: canonical URLs, social images, sitemap and robots rules.
- Accessibility pass for sliders, forms, focus states and status messages.

### Mine cykler

- Edit, retire and delete a registered bike.
- Edit or remove incorrect log entries with an audit-friendly policy.
- Upload private receipts and service documents after storage is selected.
- Select which bike-log component changes should be copied into a listing.
- Add an explicit confirmation step tying a completed marketplace sale to the
  registration-transfer action.

### Reliability and operations

- Extend rate limits to uploads and authentication-sensitive actions when those
  flows are implemented.
- Browser-level tests for signup, profile, draft, favorite and forum flows.
- Browser-level test for the seller-to-moderator publication path.
- Error tracking, product analytics and database monitoring.
- Privacy policy, terms, retention rules and a user deletion/export process.
- Backup/restore rehearsal and production seed separation.

## Recommended sequence

1. Select object storage and build listing-image upload.
2. Build private ownership-document upload and signed moderator previews.
3. Provision production moderators and document the operating procedure.
4. Add browser tests, accessibility and operational safeguards.
5. Run a closed test with real sellers before adding quiz, chat or payments.

Quiz, payments, escrow, shipping integrations, price estimation and real-time
chat remain deliberately outside the MVP.
