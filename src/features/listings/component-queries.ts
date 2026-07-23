import "server-only";

import { getApplicationDatabase } from "@/lib/database";
import type { ListingComponentChange } from "./types";

export type ListingComponentEditor = {
  id: string;
  title: string;
  status: "draft" | "rejected";
  changes: ListingComponentChange[];
};

export async function getListingComponentEditor(
  userId: string,
  listingId: string,
): Promise<ListingComponentEditor | null> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select id, title, status
      from public.listings
      where id = ${listingId}::uuid
        and seller_id = ${userId}
        and status in ('draft', 'rejected')
      limit 1
    `,
    transaction`
      select
        id,
        category,
        previous_component,
        replacement_brand,
        replacement_model,
        changed_on,
        notes,
        documentation_available
      from public.listing_component_changes
      where listing_id = ${listingId}::uuid
      order by changed_on desc nulls last, created_at desc
    `,
  ]);

  const listings = results[1] as unknown as Array<{
    id: string;
    title: string;
    status: "draft" | "rejected";
  }>;
  const listing = listings[0];
  if (!listing) return null;

  return {
    ...listing,
    changes: results[2] as unknown as ListingComponentChange[],
  };
}
