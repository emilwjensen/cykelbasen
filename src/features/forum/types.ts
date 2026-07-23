export type ForumSort = "newest" | "score";

export type ForumCategory = {
  slug: string;
  name: string;
  description: string;
  post_count: number;
  last_activity: string | null;
};

export type ForumPostSummary = {
  id: string;
  title: string;
  body: string;
  score: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  category_slug: string;
  category_name: string;
  author_id: string;
  author_name: string;
  author_city: string | null;
};

export type ForumPostDetail = ForumPostSummary & {
  current_vote: -1 | 0 | 1;
};

export type ForumComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  body: string;
  score: number;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  current_vote: -1 | 0 | 1;
};

export type EditableForumPost = {
  id: string;
  category_slug: string;
  title: string;
  body: string;
};

export type ForumFormState = {
  message?: string;
  errors?: Record<string, string[]>;
};

export const reportReasons = [
  { value: "spam", label: "Spam eller reklame" },
  { value: "scam", label: "Svindel eller vildledning" },
  { value: "harassment", label: "Chikane eller truende adfærd" },
  { value: "personal-data", label: "Private personoplysninger" },
  { value: "other", label: "Andet" },
] as const;

export type ReportReason = (typeof reportReasons)[number]["value"];
