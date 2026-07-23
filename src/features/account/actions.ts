"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, requireUser } from "@/lib/auth/server";
import {
  deleteListingImageBlob,
  deletePrivateDocumentBlob,
} from "@/lib/blob-storage";
import { getApplicationDatabase } from "@/lib/database";

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(128),
  confirmation: z.literal("SLET MIN KONTO"),
});

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();
  const parsed = deleteAccountSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) redirect("/konto?fejl=bekraeftelse");

  const database = getApplicationDatabase();
  await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      insert into public.account_deletion_requests (user_id, status)
      values (${user.id}, 'requested')
      on conflict (user_id) do update
      set
        status = 'requested',
        requested_at = now(),
        completed_at = null,
        failure_note = null
    `,
  ]);

  const { error } = await auth.deleteUser({ password: parsed.data.password });
  if (error) {
    await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        delete from public.account_deletion_requests
        where user_id = ${user.id} and status = 'requested'
      `,
    ]);
    redirect("/konto?fejl=adgangskode");
  }

  let paths: { private?: string[]; public?: string[] } = {};
  try {
    const results = await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        select public.delete_application_account() as paths
      `,
    ]);
    paths = (
      results[1] as unknown as Array<{
        paths: { private?: string[]; public?: string[] };
      }>
    )[0]?.paths ?? {};
  } catch {
    redirect("/konto/sletning-fejlede");
  }

  await Promise.allSettled([
    ...(paths.private ?? []).map((pathname) =>
      deletePrivateDocumentBlob(pathname),
    ),
    ...(paths.public ?? []).map((pathname) =>
      deleteListingImageBlob(pathname),
    ),
  ]);
  await auth.signOut();
  redirect("/?konto=slettet");
}
