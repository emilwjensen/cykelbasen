# ADR 0006: Use separate Vercel Blob stores for uploads

Status: Accepted

## Decision

Use Vercel Blob as the external object-storage provider.

Create two stores with separate credentials:

- a public store for listing images
- a private store for ownership evidence

Neon stores only object references, public image URLs and file metadata. It does
not store uploaded bytes.

Listing images are uploaded through authenticated server actions and delivered
directly from the public Blob CDN. Ownership documents are uploaded through
authenticated server actions to the private store. Owners and moderators open
documents through an authenticated application route that creates a
short-lived, object-scoped read URL.

## Security boundaries

- `LISTING_IMAGES_BLOB_READ_WRITE_TOKEN` can access only the public image store.
- `OWNERSHIP_DOCUMENTS_BLOB_READ_WRITE_TOKEN` can access only the private
  document store.
- Tokens are server-only and never included in browser bundles.
- Image uploads allow JPEG, PNG and WebP up to 5 MB.
- Document uploads allow PDF, JPEG, PNG and WebP up to 10 MB.
- The server checks both the reported media type and the file signature.
- Database RLS and listing state checks authorize every metadata change.
- Private previews expire after two minutes and are scoped to one object.
- Private responses and preview routes must never be cached publicly.

## Reason

The application already deploys to Vercel. Blob supplies public CDN delivery,
private stores and scoped expiring access without adding another runtime or
placing file bytes in Postgres. Separate stores preserve the product requirement
that listing images and ownership documents have different exposure.

## Consequences

- Both Blob stores must be created and connected before real uploads work.
- Local development needs both read-write tokens in `.env`.
- Server uploads are intentionally capped below the Vercel Function request
  limit. A later client-upload slice can be added if larger files become a real
  requirement.
- Blob lifecycle and backup procedures remain an operations responsibility.

