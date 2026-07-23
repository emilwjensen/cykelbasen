"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireUser();
  const parsed = z.string().uuid().safeParse(notificationId);
  if (!parsed.success) redirect("/notifikationer?fejl=1");
  const database = getApplicationDatabase();
  await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      update public.notifications
      set read_at = coalesce(read_at, now())
      where id = ${parsed.data}::uuid and user_id = ${user.id}
    `,
  ]);
  revalidatePath("/notifikationer");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  const database = getApplicationDatabase();
  await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`select public.mark_all_notifications_read()`,
  ]);
  revalidatePath("/notifikationer");
  redirect("/notifikationer?laest=1");
}

export async function updateNotificationPreferencesAction(
  formData: FormData,
) {
  const user = await requireUser();
  const parsed = z
    .object({
      inAppEnabled: z.boolean(),
      contactEmailEnabled: z.boolean(),
      maintenanceEmailEnabled: z.boolean(),
    })
    .parse({
      inAppEnabled: formData.get("inAppEnabled") === "on",
      contactEmailEnabled: formData.get("contactEmailEnabled") === "on",
      maintenanceEmailEnabled:
        formData.get("maintenanceEmailEnabled") === "on",
    });
  const database = getApplicationDatabase();
  await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      insert into public.notification_preferences (
        user_id,
        in_app_enabled,
        contact_email_enabled,
        maintenance_email_enabled
      )
      values (
        ${user.id},
        ${parsed.inAppEnabled},
        ${parsed.contactEmailEnabled},
        ${parsed.maintenanceEmailEnabled}
      )
      on conflict (user_id) do update
      set
        in_app_enabled = excluded.in_app_enabled,
        contact_email_enabled = excluded.contact_email_enabled,
        maintenance_email_enabled = excluded.maintenance_email_enabled,
        updated_at = now()
    `,
  ]);
  revalidatePath("/notifikationer");
  redirect("/notifikationer?gemt=1");
}
