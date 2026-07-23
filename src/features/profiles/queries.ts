import "server-only";

import { getApplicationDatabase } from "@/lib/database";
import type { Profile } from "./types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select id, display_name, city
      from public.profiles
      where id = ${userId}
      limit 1
    `,
  ]);

  const rows = results[1] as unknown as Profile[];
  return rows[0] ?? null;
}

