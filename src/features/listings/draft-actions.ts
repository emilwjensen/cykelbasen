"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/profiles/queries";
import {
  createDraftListing,
  updateDraftListing,
} from "./draft-queries";
import { parseDraftListingForm } from "./draft-schema";
import type { ListingFormState } from "./draft-types";

function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

export async function createDraftAction(
  _state: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  if (!profile) {
    redirect("/profil?ny=1");
  }

  const parsed = parseDraftListingForm(formData);
  if (!parsed.success) {
    return {
      message: "Kontrollér de markerede felter.",
      errors: fieldErrors(parsed.error),
    };
  }

  try {
    const listingId = await createDraftListing(user.id, parsed.data);

    if (!listingId) {
      return { message: "Kladde kunne ikke oprettes." };
    }
  } catch {
    return { message: "Kladde kunne ikke gemmes. Prøv igen." };
  }

  revalidatePath("/mine-annoncer");
  redirect("/mine-annoncer?oprettet=1");
}

export async function updateDraftAction(
  listingId: string,
  _state: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const user = await requireUser();
  const validId = z.string().uuid().safeParse(listingId);

  if (!validId.success) {
    return { message: "Annoncen kunne ikke findes." };
  }

  const parsed = parseDraftListingForm(formData);
  if (!parsed.success) {
    return {
      message: "Kontrollér de markerede felter.",
      errors: fieldErrors(parsed.error),
    };
  }

  try {
    const updated = await updateDraftListing(
      user.id,
      validId.data,
      parsed.data,
    );

    if (!updated) {
      return { message: "Annoncen kan ikke længere redigeres." };
    }
  } catch {
    return { message: "Ændringerne kunne ikke gemmes. Prøv igen." };
  }

  revalidatePath("/mine-annoncer");
  redirect("/mine-annoncer?gemt=1");
}

