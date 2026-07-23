export const contactIntents = [
  { value: "question", label: "Spørgsmål til cyklen" },
  { value: "viewing", label: "Aftal fremvisning" },
  { value: "offer", label: "Giv et bud" },
  { value: "other", label: "Andet" },
] as const;

export type ContactIntent = (typeof contactIntents)[number]["value"];
export type ContactRequestStatus = "new" | "read" | "closed";
export type ListingReservationStatus = "active" | "cancelled" | "completed";

export type SellerContactRequest = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_status: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  intent: ContactIntent;
  message: string;
  status: ContactRequestStatus;
  created_at: string;
  read_at: string | null;
  closed_at: string | null;
  reservation_id: string | null;
  reservation_status: ListingReservationStatus | null;
  active_listing_reservation_id: string | null;
};

export type BuyerContactRequest = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_status: string;
  seller_name: string;
  intent: ContactIntent;
  message: string;
  status: ContactRequestStatus;
  created_at: string;
  reservation_id: string | null;
  reservation_status: ListingReservationStatus | null;
};
