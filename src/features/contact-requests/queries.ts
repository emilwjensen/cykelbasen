import "server-only";

import { getApplicationDatabase } from "@/lib/database";
import type {
  BuyerContactRequest,
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
        request.buyer_id,
        buyer.display_name as buyer_name,
        request.buyer_email,
        request.intent,
        request.message,
        request.status,
        request.created_at,
        request.read_at,
        request.closed_at,
        reservation.id as reservation_id,
        reservation.status as reservation_status,
        active_reservation.id as active_listing_reservation_id
      from public.contact_requests request
      join public.listings listing on listing.id = request.listing_id
      join public.profiles buyer on buyer.id = request.buyer_id
      left join lateral (
        select candidate.id, candidate.status
        from public.listing_reservations candidate
        where candidate.contact_request_id = request.id
        order by candidate.created_at desc
        limit 1
      ) reservation on true
      left join lateral (
        select candidate.id
        from public.listing_reservations candidate
        where candidate.listing_id = request.listing_id
          and candidate.status = 'active'
        limit 1
      ) active_reservation on true
      where request.seller_id = ${userId}
        and request.status = ${status}::public.contact_request_status
      order by request.created_at desc
    `,
  ]);

  return results[1] as unknown as SellerContactRequest[];
}

export async function getBuyerContactRequests(
  userId: string,
): Promise<BuyerContactRequest[]> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select
        request.id,
        request.listing_id,
        listing.title as listing_title,
        listing.status as listing_status,
        seller.display_name as seller_name,
        request.intent,
        request.message,
        request.status,
        request.created_at,
        reservation.id as reservation_id,
        reservation.status as reservation_status
      from public.contact_requests request
      join public.listings listing on listing.id = request.listing_id
      join public.profiles seller on seller.id = request.seller_id
      left join lateral (
        select candidate.id, candidate.status
        from public.listing_reservations candidate
        where candidate.contact_request_id = request.id
        order by candidate.created_at desc
        limit 1
      ) reservation on true
      where request.buyer_id = ${userId}
      order by request.created_at desc
    `,
  ]);

  return results[1] as unknown as BuyerContactRequest[];
}
