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
        count(log.id)::int as log_count,
        max(log.occurred_on) as last_log_on
      from public.garage_bikes bike
      left join public.bike_log_entries log on log.bike_id = bike.id
      where bike.owner_id = ${userId}
      group by bike.id
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
        count(log.id)::int as log_count,
        max(log.occurred_on) as last_log_on
      from public.garage_bikes bike
      left join public.bike_log_entries log on log.bike_id = bike.id
      where bike.id = ${bikeId}::uuid
        and bike.owner_id = ${userId}
      group by bike.id
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
  ]);

  const bikes = results[1] as unknown as Array<Omit<GarageBikeDetail, "logs">>;
  const bike = bikes[0];
  if (!bike) return null;

  return {
    ...bike,
    logs: results[2] as unknown as BikeLogEntry[],
    ownership_history: results[3] as unknown as BikeOwnershipPeriod[],
  };
}
