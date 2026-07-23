import "server-only";

import { getApplicationDatabase } from "@/lib/database";
import type {
  ListingMedia,
  ManagedListingImage,
  ManagedOwnershipDocument,
} from "./media-types";

export async function getListingMedia(
  userId: string,
  listingId: string,
): Promise<ListingMedia | null> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select status, title
      from public.listings
      where id = ${listingId}::uuid
        and seller_id = ${userId}
      limit 1
    `,
    transaction`
      select
        id,
        image_url,
        alt_text,
        position,
        original_filename,
        content_type,
        size_bytes
      from public.listing_images
      where listing_id = ${listingId}::uuid
      order by position
    `,
    transaction`
      select
        id,
        status,
        original_filename,
        content_type,
        size_bytes,
        frame_number_hash is not null as frame_number_registered,
        review_note,
        created_at
      from public.ownership_documents
      where listing_id = ${listingId}::uuid
        and owner_id = ${userId}
      order by created_at desc
    `,
  ]);

  const listing = (results[1] as unknown as Array<{
    status: ListingMedia["listingStatus"];
    title: string;
  }>)[0];
  if (!listing) return null;

  return {
    listingTitle: listing.title,
    listingStatus: listing.status,
    images: results[2] as unknown as ManagedListingImage[],
    documents: results[3] as unknown as ManagedOwnershipDocument[],
  };
}

export async function getOwnershipDocumentObject(
  userId: string,
  documentId: string,
) {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select id, object_key
      from public.ownership_documents
      where id = ${documentId}::uuid
      limit 1
    `,
  ]);

  const rows = results[1] as unknown as Array<{
    id: string;
    object_key: string;
  }>;
  return rows[0] ?? null;
}
