import type { DraftListingInput } from "./draft-schema";

export type SellerListing = {
  id: string;
  title: string;
  brand: string;
  model: string;
  price_dkk: number;
  status: "draft" | "pending_review" | "rejected" | "published" | "reserved" | "sold" | "archived";
  updated_at: string;
  cover_url: string | null;
};

export type EditableListing = DraftListingInput & {
  id: string;
  status: SellerListing["status"];
};

export type ListingFormState = {
  message?: string;
  errors?: Record<string, string[]>;
};

