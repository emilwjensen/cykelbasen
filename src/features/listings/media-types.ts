export type ManagedListingImage = {
  id: string;
  image_url: string;
  alt_text: string;
  position: number;
  original_filename: string | null;
  content_type: string | null;
  size_bytes: number | null;
};

export type ManagedOwnershipDocument = {
  id: string;
  status: "pending" | "approved" | "rejected";
  original_filename: string | null;
  content_type: string | null;
  size_bytes: number | null;
  frame_number_registered: boolean;
  review_note: string | null;
  created_at: string;
};

export type ListingMedia = {
  listingTitle: string;
  images: ManagedListingImage[];
  documents: ManagedOwnershipDocument[];
  listingStatus:
    | "draft"
    | "pending_review"
    | "rejected"
    | "published"
    | "reserved"
    | "sold"
    | "archived";
};
