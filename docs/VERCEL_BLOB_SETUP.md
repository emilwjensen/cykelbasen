# Vercel Blob setup

Last verified: 2026-07-23.

Cykelbasen uses two stores. Public listing images and private documents must
never share access mode or credentials.

## 1. Create the public image store

1. Open the Cykelbasen project in the Vercel dashboard.
2. Open **Storage**, choose **Create Database**, then **Blob**.
3. Name the store `cykelbasen-listing-images`.
4. Select **Public** access and connect it to the project.
5. Open the store's environment-variable instructions and copy its read/write
   token value.
6. In project **Settings → Environment Variables**, save that value as
   `LISTING_IMAGES_BLOB_READ_WRITE_TOKEN`.
7. Enable it for Development, Preview and Production.

Objects in this store are public. The application still validates type,
signature and size, caps a listing at eight images, and stores the public URL
and object key in Neon.

## 2. Create the private document store

1. Return to **Storage** and create another Blob store.
2. Name it `cykelbasen-private-documents`.
3. Select **Private** access and connect it to the project.
4. Copy this store's read/write token into the project variable
   `PRIVATE_DOCUMENTS_BLOB_READ_WRITE_TOKEN`.
5. Enable it for Development, Preview and Production.

The private store contains listing ownership evidence and private bike-pass
documents. The browser never receives this token or a raw object path. The
server authorizes each preview and issues a two-minute, object-scoped URL.

`OWNERSHIP_DOCUMENTS_BLOB_READ_WRITE_TOKEN` remains a temporary compatibility
fallback. New environments should use `PRIVATE_DOCUMENTS_BLOB_READ_WRITE_TOKEN`.

## 3. Configure local development

Copy both values to `.env` (not `.env.local`; the repository scripts load
`.env`), then restart `pnpm dev`:

```dotenv
LISTING_IMAGES_BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
PRIVATE_DOCUMENTS_BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

Never prefix either variable with `NEXT_PUBLIC_`, commit `.env`, paste a token
in an issue, or reuse the private token for public images.

## 4. Verify the separation

1. Create a draft listing and upload one image. Its URL should load directly in
   a signed-out browser.
2. Upload listing ownership evidence. Copying its object path must not produce
   a public file.
3. Register a bike and upload a small test receipt from its **Private
   document folder**.
4. Open the receipt through the application. The generated URL should expire.
5. Delete the test objects in the UI and confirm their metadata disappears.

If the UI reports that storage is not configured, verify the variable names,
environment scopes and that the deployment was redeployed after adding them.

Official references: [Vercel Blob overview](https://vercel.com/docs/vercel-blob),
[public stores](https://vercel.com/docs/vercel-blob/public-storage) and
[private stores](https://vercel.com/docs/vercel-blob/private-storage).
