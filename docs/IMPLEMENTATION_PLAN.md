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
- Direct image upload to the selected object-storage provider.
- Image order and cover image.

Current evidence: authenticated user creates and edits a structured draft.

Exit criteria: authenticated user creates a complete draft with images.

## Phase 3, ownership review

- [x] Neon Auth and restricted RLS application role.
- Private document upload.
- [x] Submit listing for review.
- [x] Moderator queue.
- Signed document preview.
- [x] Approve and reject actions.
- [x] Publish action after approval.

Current evidence: sellers can submit only a draft with both an image record and
a pending ownership-document record. Moderators process a private queue, and a
single database function stores the decision, publishes or rejects the listing
and writes its audit event. File upload and signed preview remain blocked on the
external object-storage decision.

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
- Preserve return URL and filters.
- Basic SEO metadata.
- [x] Listing reports and moderator removal flow.
- [x] Purchase date, owner count and documentation indicators.
- [x] Structured listing component history.
- [x] Private “Mine cykler” area and bike logs.
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
- Image file validation and size limits.
- Audit logs for moderation actions.
- Error tracking and product analytics.
- Terms, privacy and reporting process.
