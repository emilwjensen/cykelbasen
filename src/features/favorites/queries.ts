import "server-only";

import type { ListingSummary } from "@/features/listings/types";
import { getApplicationDatabase } from "@/lib/database";

export async function isListingFavorite(userId: string, listingId: string) {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select exists (
        select 1
        from public.listing_favorites
        where user_id = ${userId}
          and listing_id = ${listingId}::uuid
      ) as favorite
    `,
  ]);

  const rows = results[1] as unknown as Array<{ favorite: boolean }>;
  return rows[0]?.favorite ?? false;
}

export async function getFavoriteListings(
  userId: string,
): Promise<ListingSummary[]> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select
        listing.id,
        listing.title,
        listing.category,
        listing.brand,
        listing.model,
        listing.model_year,
        listing.frame_size_label,
        listing.material,
        listing.price_dkk,
        listing.condition,
        listing.city,
        listing.published_at,
        cover.image_url as cover_url,
        cover.alt_text as cover_alt,
        count(*) over()::integer as total_count
      from public.listing_favorites favorite
      join public.listings listing on listing.id = favorite.listing_id
      left join lateral (
        select image.image_url, image.alt_text
        from public.listing_images image
        where image.listing_id = listing.id
        order by image.position
        limit 1
      ) cover on true
      where favorite.user_id = ${userId}
        and listing.status = 'published'
      order by favorite.created_at desc
    `,
  ]);

  return results[1] as unknown as ListingSummary[];
}
