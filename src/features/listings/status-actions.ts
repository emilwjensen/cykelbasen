"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";

const statusChangeSchema = z.object({
  listingId: z.string().uuid(),
  status: z.enum(["sold", "archived"]),
});

export async function setSellerListingStatusAction(
  listingId: string,
  status: "sold" | "archived",
) {
  const user = await requireUser();
  const parsed = statusChangeSchema.safeParse({ listingId, status });

  if (!parsed.success) {
    redirect("/mine-annoncer?fejl=status");
  }

  let changed = false;

  try {
    const database = getApplicationDatabase();
    const results = await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        select public.set_seller_listing_status(
          ${parsed.data.listingId}::uuid,
          ${parsed.data.status}::public.listing_status
        ) as changed
      `,
    ]);
    const rows = results[1] as unknown as Array<{ changed: boolean }>;
    changed = rows[0]?.changed ?? false;
  } catch {
    redirect("/mine-annoncer?fejl=status");
  }

  if (!changed) {
    redirect("/mine-annoncer?fejl=status");
  }

  revalidatePath("/cykler");
  revalidatePath(`/cykler/${parsed.data.listingId}`);
  revalidatePath("/mine-annoncer");
  revalidatePath("/favoritter");
  redirect(`/mine-annoncer?status=${parsed.data.status}`);
}
