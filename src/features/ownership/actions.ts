"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isModerator } from "@/features/moderation/queries";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";

export async function submitListingForReviewAction(listingId: string) {
  const user = await requireUser();
  const validListingId = z.string().uuid().safeParse(listingId);
  if (!validListingId.success) redirect("/mine-annoncer?fejl=kontrol");

  let submitted = false;

  try {
    const database = getApplicationDatabase();
    const results = await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        select public.submit_listing_for_review(
          ${validListingId.data}::uuid
        ) as submitted
      `,
    ]);
    const rows = results[1] as unknown as Array<{ submitted: boolean }>;
    submitted = rows[0]?.submitted ?? false;
  } catch {
    redirect("/mine-annoncer?fejl=kontrol");
  }

  if (!submitted) redirect("/mine-annoncer?fejl=kontrol");

  revalidatePath("/mine-annoncer");
  revalidatePath("/admin/dokumentation");
  redirect("/mine-annoncer?indsendt=1");
}

const moderationSchema = z.object({
  documentId: z.string().uuid(),
  listingId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().min(5).max(1_000),
});

export async function moderateOwnershipDocumentAction(formData: FormData) {
  const user = await requireUser();
  if (!(await isModerator(user.id))) redirect("/cykler");

  const parsed = moderationSchema.safeParse({
    documentId: formData.get("documentId"),
    listingId: formData.get("listingId"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });
  if (!parsed.success) redirect("/admin/dokumentation?fejl=ugyldig");

  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      select public.moderate_ownership_document(
        ${parsed.data.documentId}::uuid,
        ${parsed.data.decision},
        ${parsed.data.note}
      ) as handled
    `,
  ]);
  const rows = results[1] as unknown as Array<{ handled: boolean }>;
  if (!rows[0]?.handled) redirect("/admin/dokumentation?fejl=behandlet");

  revalidatePath("/cykler");
  revalidatePath(`/cykler/${parsed.data.listingId}`);
  revalidatePath("/mine-annoncer");
  revalidatePath("/admin/dokumentation");
  redirect("/admin/dokumentation?gemt=1");
}
