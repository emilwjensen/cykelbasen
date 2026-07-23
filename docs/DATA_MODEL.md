# Data model

The marketplace foundation starts in `db/migrations/001_initial_marketplace.sql`.
Forum tables, least-privilege grants and reports are added by migrations `004`
through `006`. Listing trust fields, component history and private registered
bikes are added by migration `007`. Favorites, seller lifecycle audit and
active-listing update protection are added by migrations `008` and `009`.
Connected bike identities, ownership periods and secure transfer invitations
are added by migrations `010` through `014`.
Marketplace reports and atomic listing moderation are added by migration `015`.
Private contact requests and database-backed write limits are added by
migration `016`.

## Public data

### profiles

Public display profile keyed by the Neon Auth user ID once auth is enabled.

### listings

Contains searchable and filterable bike specs. Sensitive ownership data is not stored here.

### listing_images

Image metadata and order. Files will live in a public object-storage namespace.

### forum_categories

Seeded forum sections.

### forum_posts

Post title, body, category, author and denormalized score.

### forum_comments

Comments and one optional parent comment.

### listing_component_changes

Structured, public history for component replacements on a visible listing.
Changes can only be edited while the listing is a draft or rejected.

### listing_favorites

Private user-to-listing relation with one favorite per user and listing. Only
the owning user can read or change it.

### listing_reports

Private reports against public listings. A seller cannot report their own
listing or read reports filed by others. Moderator decisions and optional
listing removal are written atomically with a listing status audit event.

### contact_requests

Private structured buyer inquiries containing intent, message and the e-mail
the buyer explicitly shares. Only buyer and seller can read a request; only the
seller can mark it read or closed.

## Private data

### moderators

Users allowed to review documents and moderate content. Only database administration should add rows.

### ownership_documents

Metadata for uploaded evidence and review state. Files will live in private object storage.

### post_votes and comment_votes

One private vote per user and target. Database triggers maintain the public
aggregate score, and the runtime role cannot update scores directly.

### content_reports

Forum post and comment reports created by authenticated users. Reports are
visible only to their reporter and moderators. A moderator decision stores the
moderator, note and timestamp atomically with an optional content hide.

### garage_bikes

Private user-owned bikes. Optional frame numbers are stored only as hashes.
Each row represents one owner's private registration period, not the complete
shared history of the physical bike.

### bike_log_entries

Private ride, service, inspection, note and component-change history belonging
to a garage bike.

### listing_status_events

Private audit trail for seller lifecycle actions. Sellers can read events for
their own listings, while only the database lifecycle function writes them.

### bike_registry_records

Opaque identity connecting multiple private registrations of the same bike.
It contains no owner profile, frame number or public metadata.

### bike_ownership_periods

Privacy-safe ownership sequence with start and end dates. Participants can read
the chain, and public listings may expose the periods without owner identities.

### bike_transfer_invites

Single-use, expiring transfer invitations. Only a SHA-256 hash of the random
token is stored. Claiming one atomically closes the seller's period and creates
a separate private registration for the buyer.

### write_rate_limit_events

Private implementation table populated by security-definer triggers. It
enforces per-user rolling limits for contact requests, forum posts/comments and
forum/listing reports.

## Listing state

```text
draft
  -> pending_review
  -> published
  -> reserved
  -> sold
  -> archived

pending_review
  -> rejected
  -> draft
```

A database trigger blocks transition to `published` without an approved ownership document.

## Main filter indexes

- Listing status and publication date
- Category and publication date
- Brand and model
- Price
- Frame size label and centimeters
- Frame material
- Brake type
- Condition
- City
- Full-text search vector

## Rules for future changes

- Add a normal column when users filter, sort or join on a value.
- Use JSONB only for rare metadata that does not drive search.
- Keep raw documents and frame numbers outside `listings`.
- Add a migration and RLS in the same change.
- Keep Neon owner credentials server-only and use a restricted role before authenticated writes.
- Update this document when a new core table or state is introduced.
