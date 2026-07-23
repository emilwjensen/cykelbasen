"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";
import { componentCategories } from "./types";

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() ? value.trim() : undefined,
    z.string().max(maximum).optional(),
  );

const componentChangeSchema = z.object({
  category: z.enum(componentCategories.map(({ value }) => value)),
  previousComponent: optionalText(160),
  replacementBrand: optionalText(60),
  replacementModel: z.string().trim().min(2).max(120),
  changedOn: z
    .string()
    .date()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: optionalText(2_000),
  documentationAvailable: z.boolean(),
});

export async function addListingComponentChangeAction(
  listingId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const validListingId = z.string().uuid().safeParse(listingId);
  const parsed = componentChangeSchema.safeParse({
    category: formData.get("category"),
    previousComponent: formData.get("previousComponent"),
    replacementBrand: formData.get("replacementBrand"),
    replacementModel: formData.get("replacementModel"),
    changedOn: formData.get("changedOn"),
    notes: formData.get("notes"),
    documentationAvailable:
      formData.get("documentationAvailable") === "on",
  });

  if (!validListingId.success || !parsed.success) {
    redirect(`/annoncer/${listingId}/komponenter?fejl=felter`);
  }

  const database = getApplicationDatabase();
  try {
    await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        insert into public.listing_component_changes (
          listing_id,
          category,
          previous_component,
          replacement_brand,
          replacement_model,
          changed_on,
          notes,
          documentation_available
        )
        values (
          ${validListingId.data}::uuid,
          ${parsed.data.category}::public.component_category,
          ${parsed.data.previousComponent ?? null},
          ${parsed.data.replacementBrand ?? null},
          ${parsed.data.replacementModel},
          ${parsed.data.changedOn ?? null}::date,
          ${parsed.data.notes ?? null},
          ${parsed.data.documentationAvailable}
        )
      `,
    ]);
  } catch {
    redirect(`/annoncer/${listingId}/komponenter?fejl=gem`);
  }

  revalidatePath(`/annoncer/${listingId}/komponenter`);
  redirect(`/annoncer/${listingId}/komponenter?gemt=1`);
}

export async function deleteListingComponentChangeAction(
  listingId: string,
  changeId: string,
) {
  const user = await requireUser();
  const validListingId = z.string().uuid().safeParse(listingId);
  const validChangeId = z.string().uuid().safeParse(changeId);
  if (!validListingId.success || !validChangeId.success) return;

  const database = getApplicationDatabase();
  await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      delete from public.listing_component_changes
      where id = ${validChangeId.data}::uuid
        and listing_id = ${validListingId.data}::uuid
    `,
  ]);

  revalidatePath(`/annoncer/${listingId}/komponenter`);
}
