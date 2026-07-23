"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";

const listingIdSchema = z.string().uuid();

export async function toggleFavoriteAction(listingId: string) {
  const user = await requireUser();
  const parsedListingId = listingIdSchema.safeParse(listingId);

  if (!parsedListingId.success) return;

  const database = getApplicationDatabase();
  await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      with removed as (
        delete from public.listing_favorites
        where user_id = ${user.id}
          and listing_id = ${parsedListingId.data}::uuid
        returning listing_id
      )
      insert into public.listing_favorites (user_id, listing_id)
      select ${user.id}, ${parsedListingId.data}::uuid
      where not exists (select 1 from removed)
    `,
  ]);

  revalidatePath("/favoritter");
  revalidatePath(`/cykler/${parsedListingId.data}`);
}
