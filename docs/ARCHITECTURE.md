# Architecture

## Application shape

Use one Next.js application and one Neon Postgres project.

```text
Browser
  -> Next.js pages and server actions
  -> Neon Auth (from the seller slice)
  -> Neon Postgres with RLS
  -> external object storage (from the seller slice)

GitHub
  -> Vercel preview and production deployments
  -> GitHub Actions quality checks
```

## Route groups

Suggested structure:

```text
app/
  (public)/
    page.tsx
    cykler/
    cykler/[id]/
    forum/
    forum/[category]/
    forum/indlaeg/[id]/
  (auth)/
    login/
    signup/
  (account)/
    profil/
    mine-annoncer/
    annoncer/ny/
    annoncer/[id]/rediger/
  admin/
    dokumentation/
    rapporter/
```

## Feature modules

Keep domain code close to each feature:

```text
features/
  listings/
    actions/
    components/
    queries/
    schemas/
    types/
  ownership/
  forum/
  moderation/
  profiles/
```

Shared code belongs in `lib/` only when multiple features use it.

## Data access

- Server components run read queries.
- Server actions perform authenticated writes.
- Database queries run on the server through `@neondatabase/serverless`.
- The database connection string is never available in the browser.
- Direct browser uploads may be added later through short-lived, scoped upload URLs.

## Listing filters

Use URL parameters as the source of truth:

```text
/cykler?q=scott&category=road&size=58&minPrice=5000&maxPrice=15000&sort=newest
```

Parse parameters with a Zod schema. Build one parameterized SQL query from the parsed values. Do not download listings and filter in the browser.

## Images

Use a public object-storage namespace for listing images. The provider is an
open Phase 2 decision.

Path convention:

```text
<user-id>/<listing-id>/<uuid>.webp
```

Store metadata in `listing_images`. The first image by `position` is the cover image.

## Ownership documents

Use a separate private object-storage namespace for ownership documents.

Path convention:

```text
<user-id>/<listing-id>/<uuid>.<extension>
```

Only the owner and moderators get signed URLs. Never expose a public storage URL.

## Neon authorization bridge

The initial public marketplace uses server-only reads and always filters on
`status = 'published'`. RLS is enabled in the initial migration.

Before the first authenticated write:

1. Enable Neon Auth and configure `NEON_AUTH_BASE_URL` plus a cookie secret.
2. Create a restricted application database role without `BYPASSRLS`.
3. Set `app.user_id` locally inside each authenticated transaction.
4. Add integration tests for anonymous, owner, other user and moderator access.

The owner connection in `DATABASE_URL` remains a migration credential and must
not become the long-term authenticated application role.

## Moderation

Moderator access comes from the `moderators` table. Do not place an editable `is_admin` flag on user profiles.

## Quiz

Build the quiz after the marketplace flow works. The quiz returns filter parameters and explanatory text. It does not need a separate recommendation database in the first version.
