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

- Create listing form with simple specs.
- Edit draft listing.
- Direct image upload to the selected object-storage provider.
- Image order and cover image.
- Seller dashboard.

Exit criteria: authenticated user creates a complete draft with images.

## Phase 3, ownership review

- Neon Auth and restricted RLS application role.
- Private document upload.
- Submit listing for review.
- Moderator queue.
- Signed document preview.
- Approve and reject actions.
- Publish action after approval.

Exit criteria: the full trust flow works without the Neon console.

## Phase 4, forum

- Category list.
- Post list and detail.
- Create and edit post.
- Comments and one-level replies.
- Voting.
- Report flow.

Exit criteria: authenticated users create discussions and vote.

## Phase 5, marketplace polish

- Favorites.
- Better sort controls.
- Filter chips and clear-all action.
- Preserve return URL and filters.
- Basic SEO metadata.
- Moderation reports.

## Phase 6, guided quiz

- Short needs form.
- Convert answers to listing filters.
- Show explanation and matched listings.
- Store no quiz data unless analytics proves a need.

## Phase 7, launch hardening

- RLS integration tests.
- Rate limits for writes.
- Image file validation and size limits.
- Audit logs for moderation actions.
- Error tracking and product analytics.
- Terms, privacy and reporting process.
