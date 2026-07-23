"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isModerator } from "@/features/moderation/queries";
import { getProfile } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";
import { listingReportSchema } from "./schema";

export async function reportListingAction(
  listingId: string,
  formData: FormData,
) {
  const user = await requireUser();
  if (!(await getProfile(user.id))) redirect("/profil?ny=1");

  const validListingId = z.string().uuid().safeParse(listingId);
  const rawReturnUrl = formData.get("returnUrl");
  const returnUrl =
    typeof rawReturnUrl === "string" &&
    (rawReturnUrl.startsWith("/cykler") || rawReturnUrl === "/favoritter")
      ? rawReturnUrl
      : "/cykler";
  const parsed = listingReportSchema.safeParse({
    reason: formData.get("reason"),
    details: formData.get("details") ?? undefined,
  });

  if (!validListingId.success || !parsed.success) {
    redirect(
      `/cykler/${listingId}?rapport=ugyldig&tilbage=${encodeURIComponent(returnUrl)}`,
    );
  }

  let result = "sendt";

  try {
    const database = getApplicationDatabase();
    await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        insert into public.listing_reports (
          reporter_id,
          listing_id,
          reason,
          details
        )
        values (
          ${user.id},
          ${validListingId.data}::uuid,
          ${parsed.data.reason}::public.listing_report_reason,
          ${parsed.data.details ?? null}
        )
      `,
    ]);
  } catch (error) {
    result =
      error && typeof error === "object" && "code" in error && error.code === "23505"
        ? "allerede"
        : "fejl";
  }

  revalidatePath("/admin/rapporter/annoncer");
  redirect(
    `/cykler/${validListingId.data}?rapport=${result}&tilbage=${encodeURIComponent(returnUrl)}`,
  );
}

const moderationSchema = z.object({
  reportId: z.string().uuid(),
  listingId: z.string().uuid(),
  decision: z.enum(["hide", "dismiss"]),
  note: z.string().trim().min(5).max(1_000),
});

export async function moderateListingReportAction(formData: FormData) {
  const user = await requireUser();
  if (!(await isModerator(user.id))) redirect("/cykler");

  const parsed = moderationSchema.safeParse({
    reportId: formData.get("reportId"),
    listingId: formData.get("listingId"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    redirect("/admin/rapporter/annoncer?fejl=ugyldig");
  }

  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      select public.moderate_listing_report(
        ${parsed.data.reportId}::uuid,
        ${parsed.data.decision},
        ${parsed.data.note}
      ) as handled
    `,
  ]);
  const rows = results[1] as unknown as Array<{ handled: boolean }>;

  if (!rows[0]?.handled) {
    redirect("/admin/rapporter/annoncer?fejl=behandlet");
  }

  revalidatePath("/cykler");
  revalidatePath(`/cykler/${parsed.data.listingId}`);
  revalidatePath("/mine-annoncer");
  revalidatePath("/admin/rapporter/annoncer");
  redirect("/admin/rapporter/annoncer?gemt=1");
}
