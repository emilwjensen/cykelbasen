# Implementation plan

Each phase should end with a working user flow and a deployable preview.

## Phase 0, foundation

- Bootstrap the Next.js application in this repository.
- Connect the Neon database through `DATABASE_URL`.
- Apply the initial migration and development seed.
- Confirm typed public database reads.
- Configure Neon Auth before the seller slice.
- Confirm GitHub Actions build.

## Phase 1, public marketplace

- Listing card component.
- Browse page with server-side filters.
- Listing detail page.
- Empty and error states.
- Seed sample published listings through a development-only script.

Exit criteria: visitors filter and open listings.

## Phase 2, seller flow

- [x] Neon Auth, profile completion and seller dashboard.
- [x] Create listing form with simple specs.
- [x] Edit draft listing.
- [x] Direct image upload to a separate public Vercel Blob store.
- [x] Image order, cover image and deletion.

Current evidence: authenticated user creates and edits a structured draft,
uploads up to eight validated images and controls cover order without database
access. Real upload testing requires the public Blob token.

Exit criteria: authenticated user creates a complete draft with images.

## Phase 3, ownership review

- [x] Neon Auth and restricted RLS application role.
- [x] Private document upload.
- [x] Submit listing for review.
- [x] Moderator queue.
- [x] Short-lived, object-scoped document preview.
- [x] Approve and reject actions.
- [x] Publish action after approval.

Current evidence: sellers can submit only a draft with both an image record and
a pending ownership-document record. Moderators process a private queue, and a
single database function stores the decision, publishes or rejects the listing
and writes its audit event. Uploads, private previews and replacement policies
are implemented; environment verification remains after the two Blob stores are
provisioned.

Exit criteria: the full trust flow works without the Neon console.

## Phase 4, forum

- [x] Category list.
- [x] Post list and detail.
- [x] Create and edit post.
- [x] Comments and one-level replies.
- [x] Voting.
- [x] Report flow and moderator hide action.

Current evidence: public forum routes render against Neon; authenticated writes
use RLS, and security tests cover author isolation, private votes, score
integrity, reply depth, private reports and atomic moderation audit.

Exit criteria met: authenticated users create discussions, vote and report
content; moderators process the queue without direct database access.

## Phase 5, marketplace polish

- [x] Favorites and buyer overview.
- [x] Brand and frame-size dropdowns.
- [x] Interactive price range.
- [x] Filter chips and clear-all action.
- [x] Preserve return URL and filters.
- [x] URL pagination with stable database ordering.
- [x] Compare up to three public listings side by side.
- [x] Metadata, canonical marketplace/listing URLs, structured data, sitemap and
  robots rules.
- [x] Listing reports and moderator removal flow.
- [x] Purchase date, owner count and documentation indicators.
- [x] Structured listing component history.
- [x] Private “Mine cykler” area and bike logs.
- [x] Date- and odometer-based maintenance planning with atomic log completion.
- [x] Prefill a listing from a registered bike.
- [x] Seller sold/archive actions with lifecycle audit.
- [x] Privacy-safe ownership chain and seller-to-buyer registration transfer.

Current evidence: visitors filter on live Neon values and see structured trust
history. Authenticated users can register a private bike, maintain odometer and
service/component logs, and start a listing from that bike. RLS tests isolate
registered-bike and log data. They also cover private favorites,
active-listing immutability and audited seller status changes.
Ownership-transfer tests also prove that ownership periods continue while
private logs remain isolated between seller and buyer.

## Phase 6, guided quiz

- Short needs form.
- Convert answers to listing filters.
- Show explanation and matched listings.
- Store no quiz data unless analytics proves a need.

## Phase 7, launch hardening

- RLS integration tests.
- [x] Database-backed rate limits for contact, forum and report writes.
- [x] Structured buyer contact request and private seller inbox.
- [x] Buyer-linked reservation, release and completed-sale lifecycle.
- [x] Image/document media-type, signature and size validation.
- Audit logs for moderation actions.
- Error tracking and product analytics.
- [x] Beta terms and privacy transparency pages; legal review and a complete
  deletion/export workflow remain.
