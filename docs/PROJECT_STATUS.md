# Project status

Last reviewed: 2026-07-23.

## Summary

Cykelbasen is a coherent, Neon-only product prototype with a working public
marketplace, authenticated seller area, private bike ownership area, forum and
forum moderation. It is not launch-ready yet because the trust-critical upload
and ownership-review flow is still missing.

The current implementation proves most read paths and several authenticated
write paths. The remaining work should prioritize completing one real seller
flow from image upload through moderator approval and publication.

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
- Brand and frame-size dropdowns, price sliders and precise price fields.
- Active-filter chips with individual removal and clear-all.
- Structured bike specifications and trust indicators.
- Purchase date, known owner count, purchase proof and service-history markers.
- Structured public component replacement history.
- Authenticated listing drafts and draft editing.
- Seller dashboard with explicit sold and archived actions.
- Private buyer favorites and a `/favoritter` overview.
- Database-enforced ownership approval before publication.
- Database guard against editing content on active or finished listings.
- Audited seller lifecycle changes.
- Private listing reports with scam/stolen-bike reasons.
- Moderator listing queue with atomic removal and lifecycle audit.

### Mine cykler

- Private route at `/mine-cykler`.
- Register a bike with an optional one-way hash of its frame number.
- Acquisition history, owner count and odometer.
- Ride, maintenance, inspection, note and component-change logs.
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
| P0 | Private ownership-document upload | The core trust promise cannot be completed by a seller. |
| P0 | Submit-for-review, moderator document queue and approve/reject UI | The database invariant exists, but the real publication flow does not. |
| P0 | Safe buyer-to-seller contact path | A buyer can find and save a bike but cannot act on it. Real-time chat remains out of scope; a minimal privacy-safe contact route is needed. |
| P0 | Rate limiting on public writes and auth-sensitive actions | Forum, reports and future contact/upload actions need abuse protection. |
| P0 | Production moderation bootstrap and operating procedure | A real moderator must be provisioned without ad hoc production SQL. |

Object storage is intentionally not replaced by Neon: Postgres stores metadata,
while image and document bytes require an external storage provider. Listing
images must be public or CDN-delivered; ownership documents must remain private
and use short-lived signed access.

## Important follow-up work

### Marketplace quality

- Pagination or cursor-based loading instead of the current 48-result limit.
- Listing image gallery when upload exists.
- Preserve an intended destination through login.
- Reporter-facing history or receipt page if testing shows a need beyond the
  current confirmation feedback.
- Reservation flow if `reserved` remains a visible product state.
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

- Browser-level tests for signup, profile, draft, favorite and forum flows.
- Tests for the full moderator publication path when implemented.
- Error tracking, product analytics and database monitoring.
- Privacy policy, terms, retention rules and a user deletion/export process.
- Backup/restore rehearsal and production seed separation.

## Recommended sequence

1. Select object storage and build listing-image upload.
2. Build private ownership-document upload and submit-for-review.
3. Build the moderator ownership queue with signed previews and atomic decisions.
4. Add minimal buyer contact and marketplace reports.
5. Add rate limits, browser tests, accessibility and operational safeguards.
6. Run a closed test with real sellers before adding quiz, chat or payments.

Quiz, payments, escrow, shipping integrations, price estimation and real-time
chat remain deliberately outside the MVP.
