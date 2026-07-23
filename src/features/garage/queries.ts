import "server-only";

import { getApplicationDatabase } from "@/lib/database";
import type {
  BikeLogEntry,
  BikeOwnershipPeriod,
  GarageBikeDetail,
  GarageBikeSummary,
} from "./types";

export async function getGarageBikes(
  userId: string,
): Promise<GarageBikeSummary[]> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select
        bike.id,
        bike.nickname,
        bike.category,
        bike.brand,
        bike.model,
        bike.model_year,
        bike.frame_size_label,
        bike.acquired_on,
        bike.ownership_ended_on,
        bike.current_odometer_km,
        bike.updated_at,
        coalesce(log_stats.log_count, 0)::int as log_count,
        log_stats.last_log_on,
        case
          when bike.ownership_ended_on is null
            then coalesce(reminder_stats.open_count, 0)
          else 0
        end::int as open_reminder_count,
        case
          when bike.ownership_ended_on is null
            then coalesce(reminder_stats.due_count, 0)
          else 0
        end::int as due_reminder_count
      from public.garage_bikes bike
      left join lateral (
        select
          count(*)::int as log_count,
          max(log.occurred_on) as last_log_on
        from public.bike_log_entries log
        where log.bike_id = bike.id
      ) log_stats on true
      left join lateral (
        select
          count(*) filter (
            where reminder.completed_at is null
          )::int as open_count,
          count(*) filter (
            where reminder.completed_at is null
              and (
                reminder.due_on <= current_date
                or reminder.due_odometer_km <= bike.current_odometer_km
              )
          )::int as due_count
        from public.bike_maintenance_reminders reminder
        where reminder.bike_id = bike.id
      ) reminder_stats on true
      where bike.owner_id = ${userId}
      order by bike.updated_at desc
    `,
  ]);

  return results[1] as unknown as GarageBikeSummary[];
}

export async function getGarageBike(
  userId: string,
  bikeId: string,
): Promise<GarageBikeDetail | null> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select
        bike.id,
        bike.nickname,
        bike.category,
        bike.brand,
        bike.model,
        bike.model_year,
        bike.frame_size_label,
        bike.acquired_on,
        bike.ownership_ended_on,
        bike.acquired_used,
        bike.owner_count_at_acquisition,
        bike.current_odometer_km,
        bike.notes,
        bike.updated_at,
        bike.serial_number_hash is not null as has_serial_number,
        coalesce(log_stats.log_count, 0)::int as log_count,
        log_stats.last_log_on,
        case
          when bike.ownership_ended_on is null
            then coalesce(reminder_stats.open_count, 0)
          else 0
        end::int as open_reminder_count,
        case
          when bike.ownership_ended_on is null
            then coalesce(reminder_stats.due_count, 0)
          else 0
        end::int as due_reminder_count
      from public.garage_bikes bike
      left join lateral (
        select
          count(*)::int as log_count,
          max(log.occurred_on) as last_log_on
        from public.bike_log_entries log
        where log.bike_id = bike.id
      ) log_stats on true
      left join lateral (
        select
          count(*) filter (
            where reminder.completed_at is null
          )::int as open_count,
          count(*) filter (
            where reminder.completed_at is null
              and (
                reminder.due_on <= current_date
                or reminder.due_odometer_km <= bike.current_odometer_km
              )
          )::int as due_count
        from public.bike_maintenance_reminders reminder
        where reminder.bike_id = bike.id
      ) reminder_stats on true
      where bike.id = ${bikeId}::uuid
        and bike.owner_id = ${userId}
      limit 1
    `,
    transaction`
      select
        id,
        log_type,
        title,
        details,
        occurred_on,
        distance_km,
        odometer_km,
        cost_dkk,
        component_category,
        component_brand,
        component_model,
        documentation_available,
        created_at
      from public.bike_log_entries
      where bike_id = ${bikeId}::uuid
      order by occurred_on desc, created_at desc
    `,
    transaction`
      select
        period.owner_sequence,
        period.started_on,
        period.ended_on,
        period.garage_bike_id = ${bikeId}::uuid as is_this_registration
      from public.bike_ownership_periods period
      join public.garage_bikes bike on bike.registry_id = period.registry_id
      where bike.id = ${bikeId}::uuid
        and bike.owner_id = ${userId}
      order by period.owner_sequence
    `,
    transaction`
      select
        reminder.id,
        reminder.title,
        reminder.component_category,
        reminder.due_on,
        reminder.due_odometer_km,
        reminder.notes,
        reminder.completed_at,
        reminder.completed_log_id,
        reminder.created_at
      from public.bike_maintenance_reminders reminder
      where reminder.bike_id = ${bikeId}::uuid
        and reminder.owner_id = ${userId}
      order by
        (reminder.completed_at is not null),
        reminder.due_on nulls last,
        reminder.due_odometer_km nulls last,
        reminder.created_at desc
    `,
  ]);

  const bikes = results[1] as unknown as Array<Omit<GarageBikeDetail, "logs">>;
  const bike = bikes[0];
  if (!bike) return null;

  return {
    ...bike,
    logs: results[2] as unknown as BikeLogEntry[],
    ownership_history: results[3] as unknown as BikeOwnershipPeriod[],
    reminders: results[4] as unknown as GarageBikeDetail["reminders"],
  };
}
