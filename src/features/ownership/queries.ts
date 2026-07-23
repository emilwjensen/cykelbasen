import "server-only";

import { getApplicationDatabase } from "@/lib/database";
import type {
  OwnershipDocumentStatus,
  OwnershipReviewItem,
} from "./types";

export async function getOwnershipReviewQueue(
  userId: string,
  status: OwnershipDocumentStatus,
): Promise<OwnershipReviewItem[]> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select
        document.id,
        document.listing_id,
        listing.title as listing_title,
        seller.display_name as seller_name,
        document.object_key,
        document.frame_number_hash is not null as frame_number_registered,
        document.status,
        document.review_note,
        document.created_at,
        document.reviewed_at,
        moderator.display_name as moderator_name
      from public.ownership_documents document
      join public.listings listing on listing.id = document.listing_id
      join public.profiles seller on seller.id = document.owner_id
      left join public.profiles moderator on moderator.id = document.reviewed_by
      where document.status = ${status}::public.document_status
        and (
          document.status <> 'pending'
          or listing.status = 'pending_review'
        )
      order by
        case when document.status = 'pending' then document.created_at end,
        document.reviewed_at desc
    `,
  ]);

  return results[1] as unknown as OwnershipReviewItem[];
}
