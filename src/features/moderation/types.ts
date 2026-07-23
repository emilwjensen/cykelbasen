import type { ReportReason } from "@/features/forum/types";

export type ReportStatus = "open" | "resolved" | "dismissed";

export type ModerationReport = {
  id: string;
  reporter_name: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  moderated_at: string | null;
  moderation_note: string | null;
  moderator_name: string | null;
  target_type: "post" | "comment";
  target_id: string;
  post_id: string;
  post_title: string;
  target_body: string;
  target_author_name: string;
  target_hidden: boolean;
};
