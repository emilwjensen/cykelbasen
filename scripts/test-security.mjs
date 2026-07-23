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

const forumOwnerResults = await applicationDatabase.transaction((transaction) => [
  transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
  transaction`
    update public.forum_posts
    set title = title
    where id = ${"40000000-0000-4000-8000-000000000001"}::uuid
    returning id
  `,
  transaction`
    select count(*)::int as count
    from public.post_votes
  `,
]);

const forumOtherResults = await applicationDatabase.transaction((transaction) => [
  transaction`select set_config('app.user_id', ${"security-test-other"}, true)`,
  transaction`
    update public.forum_posts
    set title = title
    where id = ${"40000000-0000-4000-8000-000000000001"}::uuid
    returning id
  `,
  transaction`
    select count(*)::int as count
    from public.post_votes
  `,
]);

assert(
  forumOwnerResults[1].length === 1,
  "Forfatteren kunne ikke opdatere sit forumindlæg.",
);
assert(
  forumOwnerResults[2][0]?.count === 1,
  "Brugeren kunne ikke læse sin egen forumstemme.",
);
assert(
  forumOtherResults[1].length === 0,
  "En anden bruger kunne opdatere forfatterens forumindlæg.",
);
assert(
  forumOtherResults[2][0]?.count === 0,
  "En anden bruger kunne læse private forumstemmer.",
);

const voteResults = await applicationDatabase.transaction((transaction) => [
  transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
  transaction`
    update public.post_votes
    set value = -1
    where post_id = ${"40000000-0000-4000-8000-000000000002"}::uuid
      and user_id = ${"seed-seller-anna"}
  `,
  transaction`
    update public.post_votes
    set value = 1
    where post_id = ${"40000000-0000-4000-8000-000000000002"}::uuid
      and user_id = ${"seed-seller-anna"}
  `,
  transaction`
    select score
    from public.forum_posts
    where id = ${"40000000-0000-4000-8000-000000000002"}::uuid
  `,
]);

assert(
  voteResults[3][0]?.score === 1,
  "Forumscore fulgte ikke ændringen af en stemme.",
);

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      update public.forum_posts
      set score = 999
      where id = ${"40000000-0000-4000-8000-000000000001"}::uuid
    `,
  ]);
  throw new Error("Forumscore kunne ændres direkte af applikationsrollen.");
} catch (error) {
  const expected =
    error instanceof Error &&
    error.message.includes("permission denied");
  if (!expected) throw error;
}

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

const forumOwnerClient = createDatabaseClient();

try {
  await forumOwnerClient.connect();
  await forumOwnerClient.query("begin");
  await forumOwnerClient.query(
    `
      insert into public.forum_comments (
        post_id,
        author_id,
        parent_id,
        body
      )
      values ($1::uuid, $2, $3::uuid, $4)
    `,
    [
      "40000000-0000-4000-8000-000000000001",
      "seed-seller-mikkel",
      "50000000-0000-4000-8000-000000000002",
      "Dette svar må ikke oprettes på niveau tre.",
    ],
  );
  await forumOwnerClient.query("commit");
  throw new Error("Et forumsvar på niveau tre blev tilladt.");
} catch (error) {
  await forumOwnerClient.query("rollback").catch(() => {});
  const expected =
    error instanceof Error &&
    error.message.includes("topniveau-kommentar");
  if (!expected) throw error;
} finally {
  await forumOwnerClient.end();
}

console.log(
  "Security tests passed: marketplace and forum RLS, managed scores, publication and reply-depth invariants.",
);
