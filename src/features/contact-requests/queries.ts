import "server-only";

import { getApplicationDatabase } from "@/lib/database";
import type {
  ContactRequestStatus,
  SellerContactRequest,
} from "./types";

export async function getSellerContactRequests(
  userId: string,
  status: ContactRequestStatus,
): Promise<SellerContactRequest[]> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select
        request.id,
        request.listing_id,
        listing.title as listing_title,
        listing.status as listing_status,
        buyer.display_name as buyer_name,
        request.buyer_email,
        request.intent,
        request.message,
        request.status,
        request.created_at,
        request.read_at,
        request.closed_at
      from public.contact_requests request
      join public.listings listing on listing.id = request.listing_id
      join public.profiles buyer on buyer.id = request.buyer_id
      where request.seller_id = ${userId}
        and request.status = ${status}::public.contact_request_status
      order by request.created_at desc
    `,
  ]);

  return results[1] as unknown as SellerContactRequest[];
}
