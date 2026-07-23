"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(80),
});

export async function saveProfileAction(formData: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    city: formData.get("city"),
  });

  if (!parsed.success) {
    redirect("/profil?fejl=ugyldige-felter");
  }

  const database = getApplicationDatabase();
  await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      insert into public.profiles (id, display_name, city)
      values (${user.id}, ${parsed.data.displayName}, ${parsed.data.city})
      on conflict (id) do update
      set
        display_name = excluded.display_name,
        city = excluded.city
    `,
  ]);

  revalidatePath("/profil");
  revalidatePath("/mine-annoncer");
  redirect("/profil?gemt=1");
}

