"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";
import { isModerator } from "./queries";

const moderationSchema = z.object({
  reportId: z.string().uuid(),
  postId: z.string().uuid(),
  decision: z.enum(["hide", "dismiss"]),
  note: z.string().trim().min(5).max(1_000),
});

export async function moderateForumReportAction(formData: FormData) {
  const user = await requireUser();
  if (!(await isModerator(user.id))) redirect("/forum");

  const parsed = moderationSchema.safeParse({
    reportId: formData.get("reportId"),
    postId: formData.get("postId"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    redirect("/admin/rapporter?fejl=ugyldig");
  }

  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      select public.moderate_forum_report(
        ${parsed.data.reportId}::uuid,
        ${parsed.data.decision},
        ${parsed.data.note}
      ) as handled
    `,
  ]);

  if (!results[1][0]?.handled) {
    redirect("/admin/rapporter?fejl=behandlet");
  }

  revalidatePath("/forum");
  revalidatePath(`/forum/indlaeg/${parsed.data.postId}`);
  revalidatePath("/admin/rapporter");
  redirect("/admin/rapporter?gemt=1");
}
