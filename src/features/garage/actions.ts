"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getProfile } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";
import {
  acceptBikeTransferSchema,
  bikeLogSchema,
  bikeMaintenanceReminderSchema,
  garageBikeSchema,
} from "./schema";
import type { BikeTransferState } from "./types";

export async function createGarageBikeAction(formData: FormData) {
  const user = await requireUser();
  if (!(await getProfile(user.id))) redirect("/profil?ny=1");

  const parsed = garageBikeSchema.safeParse({
    nickname: formData.get("nickname"),
    category: formData.get("category"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    modelYear: formData.get("modelYear"),
    frameSizeLabel: formData.get("frameSizeLabel"),
    serialNumber: formData.get("serialNumber"),
    acquiredOn: formData.get("acquiredOn"),
    acquiredUsed: formData.get("acquiredUsed") === "on",
    ownerCountAtAcquisition: formData.get("ownerCountAtAcquisition"),
    currentOdometerKm: formData.get("currentOdometerKm"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) redirect("/mine-cykler/ny?fejl=felter");

  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      insert into public.garage_bikes (
        owner_id,
        nickname,
        category,
        brand,
        model,
        model_year,
        frame_size_label,
        serial_number_hash,
        acquired_on,
        acquired_used,
        owner_count_at_acquisition,
        current_odometer_km,
        notes
      )
      values (
        ${user.id},
        ${parsed.data.nickname},
        ${parsed.data.category}::public.bike_category,
        ${parsed.data.brand},
        ${parsed.data.model},
        ${parsed.data.modelYear ?? null},
        ${parsed.data.frameSizeLabel ?? null},
        case
          when ${parsed.data.serialNumber ?? null}::text is null then null
          else encode(
            digest(${parsed.data.serialNumber ?? null}::text, 'sha256'),
            'hex'
          )
        end,
        ${parsed.data.acquiredOn}::date,
        ${parsed.data.acquiredUsed},
        ${parsed.data.ownerCountAtAcquisition},
        ${parsed.data.currentOdometerKm},
        ${parsed.data.notes ?? null}
      )
      returning id
    `,
  ]);

  const rows = results[1] as unknown as Array<{ id: string }>;
  if (!rows[0]) redirect("/mine-cykler/ny?fejl=gem");

  revalidatePath("/mine-cykler");
  redirect(`/mine-cykler/${rows[0].id}?oprettet=1`);
}

export async function createBikeLogAction(
  bikeId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const validBikeId = z.string().uuid().safeParse(bikeId);
  const parsed = bikeLogSchema.safeParse({
    logType: formData.get("logType"),
    title: formData.get("title"),
    details: formData.get("details"),
    occurredOn: formData.get("occurredOn"),
    distanceKm: formData.get("distanceKm"),
    odometerKm: formData.get("odometerKm"),
    costDkk: formData.get("costDkk"),
    componentCategory: formData.get("componentCategory"),
    componentBrand: formData.get("componentBrand"),
    componentModel: formData.get("componentModel"),
    documentationAvailable: formData.get("documentationAvailable") === "on",
  });

  if (!validBikeId.success || !parsed.success) {
    redirect(`/mine-cykler/${bikeId}?fejl=log#ny-log`);
  }

  const database = getApplicationDatabase();
  try {
    await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        insert into public.bike_log_entries (
          bike_id,
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
          documentation_available
        )
        values (
          ${validBikeId.data}::uuid,
          ${parsed.data.logType}::public.bike_log_type,
          ${parsed.data.title},
          ${parsed.data.details ?? null},
          ${parsed.data.occurredOn}::date,
          ${parsed.data.distanceKm ?? null},
          ${parsed.data.odometerKm ?? null},
          ${parsed.data.costDkk ?? null},
          ${parsed.data.componentCategory ?? null}::public.component_category,
          ${parsed.data.componentBrand ?? null},
          ${parsed.data.componentModel ?? null},
          ${parsed.data.documentationAvailable}
        )
      `,
      transaction`
        update public.garage_bikes
        set current_odometer_km = case
          when ${parsed.data.odometerKm ?? null}::integer is not null
            then greatest(
              current_odometer_km,
              ${parsed.data.odometerKm ?? null}::integer
            )
          when ${parsed.data.logType} = 'ride'
            and ${parsed.data.distanceKm ?? null}::integer is not null
            then current_odometer_km + ${parsed.data.distanceKm ?? null}::integer
          else current_odometer_km
        end
        where id = ${validBikeId.data}::uuid
          and owner_id = ${user.id}
      `,
    ]);
  } catch {
    redirect(`/mine-cykler/${bikeId}?fejl=log#ny-log`);
  }

  revalidatePath("/mine-cykler");
  revalidatePath(`/mine-cykler/${bikeId}`);
  redirect(`/mine-cykler/${bikeId}?logget=1#historik`);
}

export async function createBikeMaintenanceReminderAction(
  bikeId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const validBikeId = z.string().uuid().safeParse(bikeId);
  const parsed = bikeMaintenanceReminderSchema.safeParse({
    title: formData.get("title"),
    componentCategory: formData.get("componentCategory"),
    dueOn: formData.get("dueOn"),
    dueOdometerKm: formData.get("dueOdometerKm"),
    notes: formData.get("notes"),
  });

  if (!validBikeId.success || !parsed.success) {
    redirect(`/mine-cykler/${bikeId}?fejl=paamindelse#vedligehold`);
  }

  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      insert into public.bike_maintenance_reminders (
        bike_id,
        owner_id,
        title,
        component_category,
        due_on,
        due_odometer_km,
        notes
      )
      select
        bike.id,
        ${user.id},
        ${parsed.data.title},
        ${parsed.data.componentCategory ?? null}::public.component_category,
        ${parsed.data.dueOn ?? null}::date,
        ${parsed.data.dueOdometerKm ?? null},
        ${parsed.data.notes ?? null}
      from public.garage_bikes bike
      where bike.id = ${validBikeId.data}::uuid
        and bike.owner_id = ${user.id}
        and bike.ownership_ended_on is null
      returning id
    `,
  ]);
  const rows = results[1] as unknown as Array<{ id: string }>;
  if (!rows[0]) {
    redirect(`/mine-cykler/${bikeId}?fejl=paamindelse#vedligehold`);
  }

  revalidatePath("/mine-cykler");
  revalidatePath(`/mine-cykler/${validBikeId.data}`);
  redirect(
    `/mine-cykler/${validBikeId.data}?paamindelse=oprettet#vedligehold`,
  );
}

export async function completeBikeMaintenanceReminderAction(
  bikeId: string,
  reminderId: string,
) {
  const user = await requireUser();
  const parsed = z
    .object({
      bikeId: z.string().uuid(),
      reminderId: z.string().uuid(),
    })
    .safeParse({ bikeId, reminderId });
  if (!parsed.success) {
    redirect(`/mine-cykler/${bikeId}?fejl=paamindelse#vedligehold`);
  }

  let logId: string | null = null;
  try {
    const database = getApplicationDatabase();
    const results = await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        select public.complete_bike_maintenance_reminder(
          ${parsed.data.reminderId}::uuid
        ) as log_id
      `,
    ]);
    const rows = results[1] as unknown as Array<{ log_id: string | null }>;
    logId = rows[0]?.log_id ?? null;
  } catch {
    redirect(
      `/mine-cykler/${parsed.data.bikeId}?fejl=paamindelse#vedligehold`,
    );
  }

  if (!logId) {
    redirect(
      `/mine-cykler/${parsed.data.bikeId}?fejl=paamindelse#vedligehold`,
    );
  }

  revalidatePath("/mine-cykler");
  revalidatePath(`/mine-cykler/${parsed.data.bikeId}`);
  redirect(
    `/mine-cykler/${parsed.data.bikeId}?paamindelse=udfoert#vedligehold`,
  );
}

export async function createBikeTransferAction(
  bikeId: string,
  previousState: BikeTransferState,
): Promise<BikeTransferState> {
  void previousState;
  const user = await requireUser();
  const validBikeId = z.string().uuid().safeParse(bikeId);

  if (!validBikeId.success) {
    return { message: "Cyklen kunne ikke findes." };
  }

  const code = randomBytes(24).toString("base64url");

  try {
    const database = getApplicationDatabase();
    const results = await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        select public.create_bike_transfer_invite(
          ${validBikeId.data}::uuid,
          ${code}
        )::text as expires_at
      `,
    ]);
    const rows = results[1] as unknown as Array<{ expires_at: string }>;
    if (!rows[0]) return { message: "Overdragelsen kunne ikke oprettes." };

    return {
      code,
      expiresAt: rows[0].expires_at,
    };
  } catch {
    return {
      message: "Overdragelsen kunne ikke oprettes. Prøv igen.",
    };
  }
}

export async function acceptBikeTransferAction(formData: FormData) {
  const user = await requireUser();
  if (!(await getProfile(user.id))) redirect("/profil?ny=1");

  const parsed = acceptBikeTransferSchema.safeParse({
    token: formData.get("token"),
    acquiredOn: formData.get("acquiredOn"),
    currentOdometerKm: formData.get("currentOdometerKm"),
  });

  if (!parsed.success) {
    redirect("/mine-cykler/overtag?fejl=felter");
  }

  let newBikeId: string | undefined;

  try {
    const database = getApplicationDatabase();
    const results = await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        select public.accept_bike_transfer_invite(
          ${parsed.data.token},
          ${parsed.data.acquiredOn}::date,
          ${parsed.data.currentOdometerKm}
        ) as bike_id
      `,
    ]);
    const rows = results[1] as unknown as Array<{ bike_id: string }>;
    newBikeId = rows[0]?.bike_id;
  } catch {
    redirect(
      `/mine-cykler/overtag?fejl=kode&kode=${encodeURIComponent(parsed.data.token)}`,
    );
  }

  if (!newBikeId) {
    redirect("/mine-cykler/overtag?fejl=kode");
  }

  revalidatePath("/mine-cykler");
  redirect(`/mine-cykler/${newBikeId}?overtaget=1`);
}
