import "server-only";

import { getApplicationDatabase } from "@/lib/database";
import type {
  DueMaintenanceNotification,
  NotificationItem,
} from "./types";

export async function getNotificationCenter(userId: string) {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select
        id,
        notification_type,
        title,
        body,
        href,
        read_at,
        created_at
      from public.notifications
      where user_id = ${userId}
      order by (read_at is null) desc, created_at desc
      limit 100
    `,
    transaction`
      select
        reminder.id,
        reminder.bike_id,
        bike.nickname as bike_name,
        reminder.title,
        reminder.due_on,
        reminder.due_odometer_km,
        bike.current_odometer_km
      from public.bike_maintenance_reminders reminder
      join public.garage_bikes bike on bike.id = reminder.bike_id
      where reminder.owner_id = ${userId}
        and reminder.completed_at is null
        and reminder.cancelled_at is null
        and bike.ownership_ended_on is null
        and bike.retired_on is null
        and (
          reminder.due_on <= current_date
          or reminder.due_odometer_km <= bike.current_odometer_km
        )
      order by reminder.due_on nulls last, reminder.created_at
    `,
    transaction`
      select
        coalesce(preference.in_app_enabled, true) as in_app_enabled,
        coalesce(preference.contact_email_enabled, true) as contact_email_enabled,
        coalesce(preference.maintenance_email_enabled, true)
          as maintenance_email_enabled
      from (values (1)) seed(value)
      left join public.notification_preferences preference
        on preference.user_id = ${userId}
    `,
  ]);

  return {
    notifications: results[1] as unknown as NotificationItem[],
    dueMaintenance: results[2] as unknown as DueMaintenanceNotification[],
    preferences: (
      results[3] as unknown as Array<{
        in_app_enabled: boolean;
        contact_email_enabled: boolean;
        maintenance_email_enabled: boolean;
      }>
    )[0],
  };
}
