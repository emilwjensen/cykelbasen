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
    select id
    from public.listings
    where id = ${"10000000-0000-4000-8000-000000000001"}::uuid
  `,
]);

const ownerDocuments = ownerResults[1][0]?.count;
const ownerListings = ownerResults[2].length;

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
assert(ownerListings === 1, "Ejeren kunne ikke læse egen annonce.");
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

const reporterResults = await applicationDatabase.transaction((transaction) => [
  transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
  transaction`select count(*)::int as count from public.content_reports`,
]);

const reportOtherResults = await applicationDatabase.transaction((transaction) => [
  transaction`select set_config('app.user_id', ${"seed-seller-mikkel"}, true)`,
  transaction`select count(*)::int as count from public.content_reports`,
]);

const moderatorReportResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"seed-moderator"}, true)`,
    transaction`select count(*)::int as count from public.content_reports`,
  ],
);

assert(
  reporterResults[1][0]?.count === 1,
  "Rapportøren kunne ikke læse sin egen rapport.",
);
assert(
  reportOtherResults[1][0]?.count === 0,
  "En anden bruger kunne læse rapportørens private rapport.",
);
assert(
  moderatorReportResults[1][0]?.count === 1,
  "Moderatoren kunne ikke læse den åbne rapportkø.",
);

const listingReporterResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`select count(*)::int as count from public.listing_reports`,
  ],
);

const listingReportOtherResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-mikkel"}, true)`,
    transaction`select count(*)::int as count from public.listing_reports`,
  ],
);

const listingReportModeratorResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"seed-moderator"}, true)`,
    transaction`select count(*)::int as count from public.listing_reports`,
  ],
);

assert(
  listingReporterResults[1][0]?.count === 1,
  "Rapportøren kunne ikke læse sin egen annoncerapport.",
);
assert(
  listingReportOtherResults[1][0]?.count === 0,
  "Sælgeren kunne læse den private rapport mod sin annonce.",
);
assert(
  listingReportModeratorResults[1][0]?.count === 1,
  "Moderatoren kunne ikke læse annoncerapport-køen.",
);

const garageOwnerResults = await applicationDatabase.transaction((transaction) => [
  transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
  transaction`select count(*)::int as count from public.garage_bikes`,
  transaction`select count(*)::int as count from public.bike_log_entries`,
]);

const garageOtherResults = await applicationDatabase.transaction((transaction) => [
  transaction`select set_config('app.user_id', ${"seed-seller-mikkel"}, true)`,
  transaction`select count(*)::int as count from public.garage_bikes`,
  transaction`select count(*)::int as count from public.bike_log_entries`,
]);

assert(
  garageOwnerResults[1][0]?.count === 1 &&
    garageOwnerResults[2][0]?.count === 2,
  "Ejeren kunne ikke læse sin private garage og cykellog.",
);
assert(
  garageOtherResults[1][0]?.count === 0 &&
    garageOtherResults[2][0]?.count === 0,
  "En anden bruger kunne læse private garage- eller logdata.",
);

const favoriteOwnerResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`select count(*)::int as count from public.listing_favorites`,
  ],
);

const favoriteOtherResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-mikkel"}, true)`,
    transaction`select count(*)::int as count from public.listing_favorites`,
  ],
);

assert(
  favoriteOwnerResults[1][0]?.count === 1,
  "Brugeren kunne ikke læse sin egen favorit.",
);
assert(
  favoriteOtherResults[1][0]?.count === 0,
  "En anden bruger kunne læse private favoritter.",
);

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      update public.listings
      set title = title || ' ændret'
      where id = ${"10000000-0000-4000-8000-000000000001"}::uuid
    `,
  ]);
  throw new Error("En sælger kunne redigere indholdet i en aktiv annonce.");
} catch (error) {
  const expected =
    error instanceof Error &&
    error.message.includes("kan ikke redigeres");
  if (!expected) throw error;
}

const otherLifecycleResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-mikkel"}, true)`,
    transaction`
      select public.set_seller_listing_status(
        ${"10000000-0000-4000-8000-000000000001"}::uuid,
        'sold'::public.listing_status
      ) as changed
    `,
  ],
);

assert(
  otherLifecycleResults[1][0]?.changed === false,
  "En anden sælger kunne afslutte ejerens annonce.",
);

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-mikkel"}, true)`,
    transaction`
      update public.listings
      set garage_bike_id = ${"70000000-0000-4000-8000-000000000001"}::uuid
      where id = ${"10000000-0000-4000-8000-000000000002"}::uuid
    `,
  ]);
  throw new Error("En sælger kunne forbinde en andens garagecykel med sin annonce.");
} catch (error) {
  const expected =
    error instanceof Error &&
    (
      error.message.includes("egen garage") ||
      error.message.includes("kan ikke redigeres")
    );
  if (!expected) throw error;
}

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      insert into public.listing_reports (
        reporter_id,
        listing_id,
        reason,
        details
      )
      values (
        ${"seed-seller-anna"},
        ${"10000000-0000-4000-8000-000000000001"}::uuid,
        'other',
        'Forsøg på at rapportere egen annonce.'
      )
    `,
  ]);
  throw new Error("En sælger kunne rapportere sin egen annonce.");
} catch (error) {
  const expected =
    error instanceof Error &&
    error.message.includes("row-level security");
  if (!expected) throw error;
}

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      select public.moderate_listing_report(
        ${"a0000000-0000-4000-8000-000000000001"}::uuid,
        'dismiss',
        'Ikke en moderatorbeslutning'
      )
    `,
  ]);
  throw new Error("En almindelig bruger kunne behandle en annoncerapport.");
} catch (error) {
  const expected =
    error instanceof Error &&
    error.message.includes("Moderatoradgang");
  if (!expected) throw error;
}

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      insert into public.listing_component_changes (
        listing_id,
        category,
        replacement_model
      )
      values (
        ${"10000000-0000-4000-8000-000000000001"}::uuid,
        'chain',
        'Må ikke kunne ændres efter publicering'
      )
    `,
  ]);
  throw new Error("Komponenthistorik kunne ændres efter publicering.");
} catch (error) {
  const expected =
    error instanceof Error &&
    error.message.includes("row-level security");
  if (!expected) throw error;
}

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      insert into public.content_reports (
        reporter_id,
        post_id,
        reason,
        details
      )
      values (
        ${"seed-seller-anna"},
        ${"40000000-0000-4000-8000-000000000001"}::uuid,
        'other',
        'Forsøg på at rapportere eget indhold.'
      )
    `,
  ]);
  throw new Error("En forfatter kunne rapportere sit eget forumindhold.");
} catch (error) {
  const expected =
    error instanceof Error &&
    error.message.includes("row-level security");
  if (!expected) throw error;
}

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      insert into public.content_reports (
        reporter_id,
        post_id,
        reason,
        details
      )
      values (
        ${"seed-seller-anna"},
        ${"40000000-0000-4000-8000-000000000002"}::uuid,
        'other',
        'Forsøg på at rapportere det samme indhold igen.'
      )
    `,
  ]);
  throw new Error("En bruger kunne rapportere det samme indhold to gange.");
} catch (error) {
  const expected =
    error instanceof Error &&
    error.message.includes("duplicate key");
  if (!expected) throw error;
}

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      select public.moderate_forum_report(
        ${"60000000-0000-4000-8000-000000000001"}::uuid,
        'dismiss',
        'Ikke en moderatorbeslutning'
      )
    `,
  ]);
  throw new Error("En almindelig bruger kunne behandle en forumrapport.");
} catch (error) {
  const expected =
    error instanceof Error &&
    error.message.includes("Moderatoradgang");
  if (!expected) throw error;
}

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
        description,
        purchase_date
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
        $11,
        $12::date
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
      "2026-01-01",
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

const moderationClient = createDatabaseClient();

try {
  await moderationClient.connect();
  await moderationClient.query("begin");
  await moderationClient.query(
    `
      insert into public.content_reports (
        id,
        reporter_id,
        post_id,
        reason,
        details
      )
      values ($1::uuid, $2, $3::uuid, 'other', $4)
    `,
    [
      "f0000000-0000-4000-8000-000000000006",
      "seed-seller-mikkel",
      "40000000-0000-4000-8000-000000000003",
      "Midlertidig rapport til atomisk moderationstest.",
    ],
  );
  await moderationClient.query("set local role cykelbasen_app");
  await moderationClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-moderator"],
  );
  const handled = await moderationClient.query(
    "select public.moderate_forum_report($1::uuid, 'hide', $2) as handled",
    [
      "f0000000-0000-4000-8000-000000000006",
      "Skjult som del af sikkerhedstesten.",
    ],
  );
  const audit = await moderationClient.query(
    `
      select
        report.status,
        report.moderated_by,
        report.moderated_at is not null as has_timestamp,
        post.hidden_by,
        post.hidden_at is not null as is_hidden
      from public.content_reports report
      join public.forum_posts post on post.id = report.post_id
      where report.id = $1::uuid
    `,
    ["f0000000-0000-4000-8000-000000000006"],
  );

  assert(handled.rows[0]?.handled === true, "Moderatorfunktionen behandlede ikke rapporten.");
  assert(audit.rows[0]?.status === "resolved", "Rapporten blev ikke afsluttet.");
  assert(
    audit.rows[0]?.moderated_by === "seed-moderator" &&
      audit.rows[0]?.hidden_by === "seed-moderator" &&
      audit.rows[0]?.has_timestamp === true &&
      audit.rows[0]?.is_hidden === true,
    "Moderatorens hide og auditfelter blev ikke gemt atomisk.",
  );
  await moderationClient.query("rollback");
} catch (error) {
  await moderationClient.query("rollback").catch(() => {});
  throw error;
} finally {
  await moderationClient.end();
}

const lifecycleClient = createDatabaseClient();

try {
  await lifecycleClient.connect();
  await lifecycleClient.query("begin");
  await lifecycleClient.query("set local role cykelbasen_app");
  await lifecycleClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-anna"],
  );
  const statusChange = await lifecycleClient.query(
    `
      select public.set_seller_listing_status(
        $1::uuid,
        'sold'::public.listing_status
      ) as changed
    `,
    ["10000000-0000-4000-8000-000000000001"],
  );
  const statusAudit = await lifecycleClient.query(
    `
      select
        listing.status,
        event.actor_id,
        event.from_status,
        event.to_status
      from public.listings listing
      join public.listing_status_events event
        on event.listing_id = listing.id
      where listing.id = $1::uuid
      order by event.created_at desc
      limit 1
    `,
    ["10000000-0000-4000-8000-000000000001"],
  );

  assert(
    statusChange.rows[0]?.changed === true &&
      statusAudit.rows[0]?.status === "sold",
    "Sælgerens gyldige statusskift blev ikke gennemført.",
  );
  assert(
    statusAudit.rows[0]?.actor_id === "seed-seller-anna" &&
      statusAudit.rows[0]?.from_status === "published" &&
      statusAudit.rows[0]?.to_status === "sold",
    "Annoncens statusskift fik ikke et korrekt auditspor.",
  );
  await lifecycleClient.query("rollback");
} catch (error) {
  await lifecycleClient.query("rollback").catch(() => {});
  throw error;
} finally {
  await lifecycleClient.end();
}

const ownershipTransferClient = createDatabaseClient();

try {
  await ownershipTransferClient.connect();
  await ownershipTransferClient.query("begin");
  await ownershipTransferClient.query("set local role cykelbasen_app");
  await ownershipTransferClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-anna"],
  );
  await ownershipTransferClient.query(
    "select public.create_bike_transfer_invite($1::uuid, $2)",
    [
      "70000000-0000-4000-8000-000000000001",
      "security-transfer-token-123456789",
    ],
  );
  await ownershipTransferClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-mikkel"],
  );
  const acceptedTransfer = await ownershipTransferClient.query(
    `
      select public.accept_bike_transfer_invite(
        $1,
        current_date,
        $2
      ) as bike_id
    `,
    ["security-transfer-token-123456789", 10_000],
  );
  const transferredBikeId = acceptedTransfer.rows[0]?.bike_id;
  const buyerRegistration = await ownershipTransferClient.query(
    `
      select
        bike.owner_id,
        bike.ownership_ended_on,
        count(period.id)::int as period_count
      from public.garage_bikes bike
      join public.bike_ownership_periods period
        on period.registry_id = bike.registry_id
      where bike.id = $1::uuid
      group by bike.id
    `,
    [transferredBikeId],
  );
  const buyerPrivateLogs = await ownershipTransferClient.query(
    "select count(*)::int as count from public.bike_log_entries where bike_id = $1::uuid",
    [transferredBikeId],
  );
  await ownershipTransferClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-anna"],
  );
  const sellerHistory = await ownershipTransferClient.query(
    `
      select
        bike.ownership_ended_on is not null as is_closed,
        count(log.id)::int as private_log_count
      from public.garage_bikes bike
      left join public.bike_log_entries log on log.bike_id = bike.id
      where bike.id = $1::uuid
      group by bike.id
    `,
    ["70000000-0000-4000-8000-000000000001"],
  );
  const sellerCanReadBuyerBike = await ownershipTransferClient.query(
    "select count(*)::int as count from public.garage_bikes where id = $1::uuid",
    [transferredBikeId],
  );
  const transferredListing = await ownershipTransferClient.query(
    `
      select
        listing.status,
        event.actor_id,
        event.from_status,
        event.to_status
      from public.listings listing
      join public.listing_status_events event
        on event.listing_id = listing.id
      where listing.id = $1::uuid
      order by event.created_at desc
      limit 1
    `,
    ["10000000-0000-4000-8000-000000000001"],
  );

  assert(
    transferredBikeId &&
      buyerRegistration.rows[0]?.owner_id === "seed-seller-mikkel" &&
      buyerRegistration.rows[0]?.ownership_ended_on === null &&
      buyerRegistration.rows[0]?.period_count === 2,
    "Køberen fik ikke en separat registrering med forbundet ejerhistorik.",
  );
  assert(
    buyerPrivateLogs.rows[0]?.count === 0,
    "Sælgerens private logs blev kopieret til køberen.",
  );
  assert(
    sellerHistory.rows[0]?.is_closed === true &&
      sellerHistory.rows[0]?.private_log_count === 2 &&
      sellerCanReadBuyerBike.rows[0]?.count === 0,
    "Sælgerens historik blev ikke bevaret privat efter overdragelsen.",
  );
  assert(
    transferredListing.rows[0]?.status === "sold" &&
      transferredListing.rows[0]?.actor_id === "seed-seller-anna" &&
      transferredListing.rows[0]?.from_status === "published" &&
      transferredListing.rows[0]?.to_status === "sold",
    "Den aktive annonce blev ikke afsluttet med auditspor ved overdragelsen.",
  );

  await ownershipTransferClient.query("rollback");
} catch (error) {
  await ownershipTransferClient.query("rollback").catch(() => {});
  throw error;
} finally {
  await ownershipTransferClient.end();
}

const listingModerationClient = createDatabaseClient();

try {
  await listingModerationClient.connect();
  await listingModerationClient.query("begin");
  await listingModerationClient.query(
    `
      insert into public.listing_reports (
        id,
        reporter_id,
        listing_id,
        reason,
        details
      )
      values ($1::uuid, $2, $3::uuid, 'misleading', $4)
    `,
    [
      "f0000000-0000-4000-8000-000000000015",
      "seed-seller-mikkel",
      "10000000-0000-4000-8000-000000000003",
      "Midlertidig annoncerapport til atomisk moderationstest.",
    ],
  );
  await listingModerationClient.query("set local role cykelbasen_app");
  await listingModerationClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-moderator"],
  );
  const handledListingReport = await listingModerationClient.query(
    "select public.moderate_listing_report($1::uuid, 'hide', $2) as handled",
    [
      "f0000000-0000-4000-8000-000000000015",
      "Fjernet som del af sikkerhedstesten.",
    ],
  );
  const listingModerationAudit = await listingModerationClient.query(
    `
      select
        report.status as report_status,
        report.moderated_by,
        report.moderated_at is not null as has_timestamp,
        listing.status as listing_status,
        event.actor_id,
        event.from_status,
        event.to_status
      from public.listing_reports report
      join public.listings listing on listing.id = report.listing_id
      join public.listing_status_events event
        on event.listing_id = listing.id
      where report.id = $1::uuid
      order by event.created_at desc
      limit 1
    `,
    ["f0000000-0000-4000-8000-000000000015"],
  );

  assert(
    handledListingReport.rows[0]?.handled === true &&
      listingModerationAudit.rows[0]?.report_status === "resolved" &&
      listingModerationAudit.rows[0]?.listing_status === "archived",
    "Moderatorfunktionen fjernede ikke den rapporterede annonce.",
  );
  assert(
    listingModerationAudit.rows[0]?.moderated_by === "seed-moderator" &&
      listingModerationAudit.rows[0]?.has_timestamp === true &&
      listingModerationAudit.rows[0]?.actor_id === "seed-moderator" &&
      listingModerationAudit.rows[0]?.from_status === "published" &&
      listingModerationAudit.rows[0]?.to_status === "archived",
    "Annoncemoderationen fik ikke et korrekt auditspor.",
  );
  await listingModerationClient.query("rollback");
} catch (error) {
  await listingModerationClient.query("rollback").catch(() => {});
  throw error;
} finally {
  await listingModerationClient.end();
}

console.log(
  "Security tests passed: marketplace reports/moderation, ownership transfer/privacy, favorites, listing lifecycle, forum RLS, audit trails, publication and reply-depth invariants.",
);
