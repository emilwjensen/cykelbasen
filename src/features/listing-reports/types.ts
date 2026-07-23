import type { ReportStatus } from "@/features/moderation/types";

export const listingReportReasons = [
  { value: "suspected-scam", label: "Mistanke om svindel" },
  { value: "suspected-stolen", label: "Mistanke om stjålet cykel" },
  { value: "misleading", label: "Vildledende oplysninger" },
  { value: "prohibited", label: "Ulovligt eller forbudt indhold" },
  { value: "duplicate", label: "Dubletannonce" },
  { value: "other", label: "Andet" },
] as const;

export type ListingReportReason =
  (typeof listingReportReasons)[number]["value"];

export type ListingModerationReport = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_status: string;
  seller_name: string;
  reporter_name: string;
  reason: ListingReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  moderated_at: string | null;
  moderation_note: string | null;
  moderator_name: string | null;
};
