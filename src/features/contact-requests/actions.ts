"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getProfile } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";
import { contactRequestSchema } from "./schema";

function safeReturnUrl(value: FormDataEntryValue | null) {
  return typeof value === "string" &&
    (value.startsWith("/cykler") || value === "/favoritter")
    ? value
    : "/cykler";
}

export async function sendContactRequestAction(
  listingId: string,
  formData: FormData,
) {
  const user = await requireUser();
  if (!(await getProfile(user.id))) redirect("/profil?ny=1");

  const validListingId = z.string().uuid().safeParse(listingId);
  const returnUrl = safeReturnUrl(formData.get("returnUrl"));
  const parsed = contactRequestSchema.safeParse({
    intent: formData.get("intent"),
    message: formData.get("message"),
  });

  if (!validListingId.success || !parsed.success || !user.email) {
    redirect(
      `/cykler/${listingId}?kontakt=ugyldig&tilbage=${encodeURIComponent(returnUrl)}`,
    );
  }

  let result = "sendt";

  try {
    const database = getApplicationDatabase();
    const results = await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        insert into public.contact_requests (
          listing_id,
          buyer_id,
          seller_id,
          intent,
          buyer_email,
          message
        )
        select
          listing.id,
          ${user.id},
          listing.seller_id,
          ${parsed.data.intent}::public.contact_request_intent,
          ${user.email},
          ${parsed.data.message}
        from public.listings listing
        where listing.id = ${validListingId.data}::uuid
          and listing.status = 'published'
          and listing.seller_id <> ${user.id}
        returning id
      `,
    ]);
    const rows = results[1] as unknown as Array<{ id: string }>;
    if (!rows[0]) result = "fejl";
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("RATE_LIMIT:contact-request")
    ) {
      result = "begraenset";
    } else if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      result = "allerede";
    } else {
      result = "fejl";
    }
  }

  revalidatePath("/henvendelser");
  redirect(
    `/cykler/${validListingId.data}?kontakt=${result}&tilbage=${encodeURIComponent(returnUrl)}`,
  );
}

const statusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["read", "closed"]),
});

export async function updateContactRequestStatusAction(
  requestId: string,
  status: "read" | "closed",
) {
  const user = await requireUser();
  const parsed = statusSchema.safeParse({ requestId, status });

  if (!parsed.success) redirect("/henvendelser?fejl=status");

  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      update public.contact_requests
      set status = ${parsed.data.status}::public.contact_request_status
      where id = ${parsed.data.requestId}::uuid
        and seller_id = ${user.id}
        and status in ('new', 'read')
      returning id
    `,
  ]);
  const rows = results[1] as unknown as Array<{ id: string }>;

  if (!rows[0]) redirect("/henvendelser?fejl=status");

  revalidatePath("/henvendelser");
  redirect(`/henvendelser?status=${parsed.data.status}&gemt=1`);
}

const reservationSchema = z.object({
  requestId: z.string().uuid(),
  listingId: z.string().uuid(),
});

export async function reserveListingForContactAction(
  requestId: string,
  listingId: string,
) {
  const user = await requireUser();
  const parsed = reservationSchema.safeParse({ requestId, listingId });
  if (!parsed.success) redirect("/henvendelser?fejl=reservation");

  let reservationId: string | null = null;

  try {
    const database = getApplicationDatabase();
    const results = await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        select public.reserve_listing_for_contact(
          ${parsed.data.requestId}::uuid
        ) as reservation_id
      `,
    ]);
    const rows = results[1] as unknown as Array<{
      reservation_id: string | null;
    }>;
    reservationId = rows[0]?.reservation_id ?? null;
  } catch {
    redirect("/henvendelser?fejl=reservation");
  }

  if (!reservationId) redirect("/henvendelser?fejl=reservation");

  revalidatePath("/cykler");
  revalidatePath(`/cykler/${parsed.data.listingId}`);
  revalidatePath("/favoritter");
  revalidatePath("/henvendelser");
  revalidatePath("/mine-annoncer");
  redirect("/henvendelser?reservation=oprettet");
}

const cancelReservationSchema = z.object({
  reservationId: z.string().uuid(),
  listingId: z.string().uuid(),
  view: z.enum(["seller", "buyer"]),
});

export async function cancelListingReservationAction(
  reservationId: string,
  listingId: string,
  view: "seller" | "buyer",
) {
  const user = await requireUser();
  const parsed = cancelReservationSchema.safeParse({
    reservationId,
    listingId,
    view,
  });
  const buyerSuffix = view === "buyer" ? "&rolle=koeber" : "";
  if (!parsed.success) {
    redirect(`/henvendelser?fejl=reservation${buyerSuffix}`);
  }

  let cancelled = false;

  try {
    const database = getApplicationDatabase();
    const results = await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        select public.cancel_listing_reservation(
          ${parsed.data.reservationId}::uuid
        ) as cancelled
      `,
    ]);
    const rows = results[1] as unknown as Array<{ cancelled: boolean }>;
    cancelled = rows[0]?.cancelled ?? false;
  } catch {
    redirect(`/henvendelser?fejl=reservation${buyerSuffix}`);
  }

  if (!cancelled) {
    redirect(`/henvendelser?fejl=reservation${buyerSuffix}`);
  }

  revalidatePath("/cykler");
  revalidatePath(`/cykler/${parsed.data.listingId}`);
  revalidatePath("/favoritter");
  revalidatePath("/henvendelser");
  revalidatePath("/mine-annoncer");
  redirect(`/henvendelser?reservation=frigivet${buyerSuffix}`);
}
