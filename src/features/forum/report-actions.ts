"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getProfile } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";
import { contentReportSchema } from "./schema";

export async function reportForumContentAction(
  postId: string,
  targetType: "post" | "comment",
  targetId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile) redirect("/profil?ny=1");

  const validPostId = z.string().uuid().safeParse(postId);
  const validTargetId = z.string().uuid().safeParse(targetId);
  const validTargetType = z.enum(["post", "comment"]).safeParse(targetType);
  const parsed = contentReportSchema.safeParse({
    reason: formData.get("reason"),
    details: formData.get("details") || undefined,
  });

  if (
    !validPostId.success ||
    !validTargetId.success ||
    !validTargetType.success ||
    !parsed.success
  ) {
    redirect(`/forum/indlaeg/${postId}?rapport=ugyldig`);
  }

  const database = getApplicationDatabase();
  let result = "sendt";

  try {
    await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      validTargetType.data === "post"
        ? transaction`
            insert into public.content_reports (
              reporter_id,
              post_id,
              reason,
              details
            )
            values (
              ${user.id},
              ${validTargetId.data}::uuid,
              ${parsed.data.reason}::public.content_report_reason,
              ${parsed.data.details}
            )
          `
        : transaction`
            insert into public.content_reports (
              reporter_id,
              comment_id,
              reason,
              details
            )
            values (
              ${user.id},
              ${validTargetId.data}::uuid,
              ${parsed.data.reason}::public.content_report_reason,
              ${parsed.data.details}
            )
          `,
    ]);
  } catch (error) {
    result =
      error && typeof error === "object" && "code" in error && error.code === "23505"
        ? "allerede"
        : "fejl";
  }

  revalidatePath("/admin/rapporter");
  redirect(`/forum/indlaeg/${validPostId.data}?rapport=${result}`);
}
