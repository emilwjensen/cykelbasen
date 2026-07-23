# Data model

The marketplace foundation starts in `db/migrations/001_initial_marketplace.sql`.
Forum tables, least-privilege grants and reports are added by migrations `004`
through `006`.

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
