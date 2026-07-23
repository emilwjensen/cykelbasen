export type OwnershipDocumentStatus = "pending" | "approved" | "rejected";

export type OwnershipReviewItem = {
  id: string;
  listing_id: string;
  listing_title: string;
  seller_name: string;
  object_key: string;
  frame_number_registered: boolean;
  status: OwnershipDocumentStatus;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  moderator_name: string | null;
};
