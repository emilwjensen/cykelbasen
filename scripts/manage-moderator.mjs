import { createDatabaseClient } from "./db-client.mjs";

const [action, userId] = process.argv.slice(2);

if (!["grant", "revoke"].includes(action) || !userId) {
  throw new Error(
    "Brug: pnpm db:moderator -- grant AUTH_USER_ID eller pnpm db:moderator -- revoke AUTH_USER_ID",
  );
}

const client = createDatabaseClient();

try {
  await client.connect();
  await client.query("begin");

  const profile = await client.query(
    "select id, display_name from public.profiles where id = $1 limit 1",
    [userId],
  );
  if (!profile.rows[0]) {
    throw new Error(
      "Brugeren har ingen profil endnu. Bed brugeren logge ind og færdiggøre profilen først.",
    );
  }

  if (action === "grant") {
    await client.query(
      `insert into public.moderators (user_id)
       values ($1)
       on conflict (user_id) do nothing`,
      [userId],
    );
  } else {
    await client.query(
      "delete from public.moderators where user_id = $1",
      [userId],
    );
  }

  await client.query("commit");
  console.log(
    action === "grant"
      ? `Moderatoradgang tildelt til ${profile.rows[0].display_name}.`
      : `Moderatoradgang fjernet fra ${profile.rows[0].display_name}.`,
  );
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  console.error(
    error instanceof Error ? `Moderatorændring fejlede: ${error.message}` : error,
  );
  process.exitCode = 1;
} finally {
  await client.end();
}

