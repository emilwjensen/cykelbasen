import { neon } from "@neondatabase/serverless";
import { createDatabaseClient } from "./db-client.mjs";

const applicationUrl = process.env.DATABASE_APP_URL;

if (!applicationUrl) {
  throw new Error("DATABASE_APP_URL mangler. Kør pnpm db:setup-app-role.");
}

const applicationDatabase = neon(applicationUrl);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const ownerResults = await applicationDatabase.transaction((transaction) => [
  transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
  transaction`
    select count(*)::int as count
    from public.ownership_documents
  `,
  transaction`
    update public.listings
    set title = title
    where id = ${"10000000-0000-4000-8000-000000000001"}::uuid
    returning id
  `,
]);

const ownerDocuments = ownerResults[1][0]?.count;
const ownerUpdates = ownerResults[2].length;

const otherResults = await applicationDatabase.transaction((transaction) => [
  transaction`select set_config('app.user_id', ${"security-test-other"}, true)`,
  transaction`
    select count(*)::int as count
    from public.ownership_documents
  `,
  transaction`
    update public.listings
    set title = title
    where id = ${"10000000-0000-4000-8000-000000000001"}::uuid
    returning id
  `,
  transaction`
    select current_user as role
  `,
]);

assert(ownerDocuments === 2, "Ejeren kunne ikke læse egne dokumentposter.");
assert(ownerUpdates === 1, "Ejeren kunne ikke opdatere egen annonce.");
assert(
  otherResults[1][0]?.count === 0,
  "En anden bruger kunne læse private dokumentposter.",
);
assert(
  otherResults[2].length === 0,
  "En anden bruger kunne opdatere ejerens annonce.",
);
assert(
  otherResults[3][0]?.role === "cykelbasen_app",
  "Sikkerhedstesten brugte ikke den begrænsede applikationsrolle.",
);

const ownerClient = createDatabaseClient();

try {
  await ownerClient.connect();
  await ownerClient.query("begin");
  await ownerClient.query(
    "insert into public.profiles (id, display_name) values ($1, $2)",
    ["security-trigger-user", "Security Trigger"],
  );
  await ownerClient.query(
    `
      insert into public.listings (
        id,
        seller_id,
        title,
        category,
        brand,
        model,
        frame_size_label,
        price_dkk,
        condition,
        city,
        description
      )
      values (
        $1::uuid,
        $2,
        $3,
        $4::public.bike_category,
        $5,
        $6,
        $7,
        $8,
        $9::public.listing_condition,
        $10,
        $11
      )
    `,
    [
      "f0000000-0000-4000-8000-000000000001",
      "security-trigger-user",
      "Testcykel uden dokumentation",
      "road",
      "Test",
      "Model",
      "56",
      10_000,
      "good",
      "Aarhus",
      "Denne annonce må ikke kunne publiceres uden et godkendt dokument.",
    ],
  );
  await ownerClient.query(
    `
      update public.listings
      set status = 'published', published_at = now()
      where id = $1::uuid
    `,
    ["f0000000-0000-4000-8000-000000000001"],
  );
  await ownerClient.query("commit");
  throw new Error("Publicering uden dokumentation blev tilladt.");
} catch (error) {
  await ownerClient.query("rollback").catch(() => {});
  const expected =
    error instanceof Error &&
    error.message.includes("godkendt ejerskabsdokumentation");

  if (!expected) throw error;
} finally {
  await ownerClient.end();
}

console.log("Security tests passed: RLS isolation and publication invariant.");

