import { z } from "zod";
import { reportReasons, type ForumSort } from "./types";

export const forumPostSchema = z.object({
  categorySlug: z
    .string()
    .trim()
    .min(1, "Vælg en kategori.")
    .max(80, "Kategorien er ugyldig."),
  title: z
    .string()
    .trim()
    .min(8, "Skriv mindst 8 tegn.")
    .max(140, "Titlen må højst være 140 tegn."),
  body: z
    .string()
    .trim()
    .min(20, "Skriv mindst 20 tegn.")
    .max(10_000, "Indlægget må højst være 10.000 tegn."),
});

export const forumCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(2, "Kommentaren er for kort.")
    .max(5_000, "Kommentaren må højst være 5.000 tegn."),
  parentId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
});

export const contentReportSchema = z.object({
  reason: z.enum(reportReasons.map(({ value }) => value)),
  details: z
    .string()
    .trim()
    .max(1_000, "Beskrivelsen må højst være 1.000 tegn.")
    .optional()
    .transform((value) => value || null)
    .refine(
      (value) => value === null || value.length >= 5,
      "Skriv mindst 5 tegn, eller lad feltet være tomt.",
    ),
});

export function parseForumSort(value: string | string[] | undefined): ForumSort {
  const first = Array.isArray(value) ? value[0] : value;
  return first === "score" ? "score" : "newest";
}

export function parseForumPostForm(formData: FormData) {
  return forumPostSchema.safeParse({
    categorySlug: formData.get("categorySlug"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
}
