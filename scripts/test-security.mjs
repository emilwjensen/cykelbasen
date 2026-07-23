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

const contactBuyerResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`select count(*)::int as count from public.contact_requests`,
  ],
);

const contactSellerResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-mikkel"}, true)`,
    transaction`select count(*)::int as count from public.contact_requests`,
  ],
);

const contactOtherResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"security-test-other"}, true)`,
    transaction`select count(*)::int as count from public.contact_requests`,
  ],
);

assert(
  contactBuyerResults[1][0]?.count === 2 &&
    contactSellerResults[1][0]?.count === 2,
  "Køber eller sælger kunne ikke læse den private henvendelse.",
);
assert(
  contactOtherResults[1][0]?.count === 0,
  "En uvedkommende bruger kunne læse en privat henvendelse.",
);

const garageOwnerResults = await applicationDatabase.transaction((transaction) => [
  transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
  transaction`select count(*)::int as count from public.garage_bikes`,
  transaction`select count(*)::int as count from public.bike_log_entries`,
  transaction`select count(*)::int as count from public.bike_maintenance_reminders`,
]);

const garageOtherResults = await applicationDatabase.transaction((transaction) => [
  transaction`select set_config('app.user_id', ${"seed-seller-mikkel"}, true)`,
  transaction`select count(*)::int as count from public.garage_bikes`,
  transaction`select count(*)::int as count from public.bike_log_entries`,
  transaction`select count(*)::int as count from public.bike_maintenance_reminders`,
]);

assert(
  garageOwnerResults[1][0]?.count === 1 &&
    garageOwnerResults[2][0]?.count === 2 &&
    garageOwnerResults[3][0]?.count === 2,
  "Ejeren kunne ikke læse sin private garage, cykellog og vedligeholdelsesplan.",
);
assert(
  garageOtherResults[1][0]?.count === 0 &&
    garageOtherResults[2][0]?.count === 0 &&
    garageOtherResults[3][0]?.count === 0,
  "En anden bruger kunne læse private garage-, log- eller vedligeholdelsesdata.",
);

const unauthorizedMaintenanceResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-mikkel"}, true)`,
    transaction`
      select public.complete_bike_maintenance_reminder(
        ${"e0000000-0000-4000-8000-000000000020"}::uuid
      ) as log_id
    `,
  ],
);

assert(
  unauthorizedMaintenanceResults[1][0]?.log_id === null,
  "En anden bruger kunne udføre ejerens vedligeholdelsesplan.",
);

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      update public.bike_maintenance_reminders
      set completed_at = now()
      where id = ${"e0000000-0000-4000-8000-000000000020"}::uuid
    `,
  ]);
  throw new Error("Ejeren kunne ændre vedligeholdelsens completion-felter direkte.");
} catch (error) {
  const expected =
    error instanceof Error &&
    error.message.includes("permission denied");
  if (!expected) throw error;
}

const maintenanceClient = createDatabaseClient();

try {
  await maintenanceClient.connect();
  await maintenanceClient.query("begin");
  await maintenanceClient.query("set local role cykelbasen_app");
  await maintenanceClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-anna"],
  );
  const completedMaintenance = await maintenanceClient.query(
    `
      select public.complete_bike_maintenance_reminder(
        $1::uuid
      ) as log_id
    `,
    ["e0000000-0000-4000-8000-000000000020"],
  );
  const maintenanceLogId = completedMaintenance.rows[0]?.log_id;
  const maintenanceAudit = await maintenanceClient.query(
    `
      select
        reminder.completed_at is not null as is_completed,
        reminder.completed_log_id,
        log.log_type,
        log.title,
        log.occurred_on = current_date as occurred_today,
        log.odometer_km,
        log.component_category
      from public.bike_maintenance_reminders reminder
      join public.bike_log_entries log
        on log.id = reminder.completed_log_id
      where reminder.id = $1::uuid
    `,
    ["e0000000-0000-4000-8000-000000000020"],
  );

  assert(
    maintenanceLogId &&
      maintenanceAudit.rows[0]?.is_completed === true &&
      maintenanceAudit.rows[0]?.completed_log_id === maintenanceLogId &&
      maintenanceAudit.rows[0]?.log_type === "maintenance" &&
      maintenanceAudit.rows[0]?.title === "Udført: Kontrollér kædeslid" &&
      maintenanceAudit.rows[0]?.occurred_today === true &&
      maintenanceAudit.rows[0]?.odometer_km === 6840 &&
      maintenanceAudit.rows[0]?.component_category === "chain",
    "Afsluttet vedligeholdelse oprettede ikke den korrekte log atomisk.",
  );

  await maintenanceClient.query("rollback");
} catch (error) {
  await maintenanceClient.query("rollback").catch(() => {});
  throw error;
} finally {
  await maintenanceClient.end();
}

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

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      update public.listings
      set status = 'reserved'
      where id = ${"10000000-0000-4000-8000-000000000001"}::uuid
    `,
  ]);
  throw new Error("En sælger kunne ændre aktiv annoncestatus uden auditfunktion.");
} catch (error) {
  const expected =
    error instanceof Error &&
    error.message.includes("lifecycle-funktionen");
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
       and event.to_status = 'sold'
      where listing.id = $1::uuid
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
  await ownershipTransferClient.query(
    `
      insert into public.contact_requests (
        id,
        listing_id,
        buyer_id,
        seller_id,
        intent,
        buyer_email,
        message
      )
      values ($1::uuid, $2::uuid, $3, $4, 'offer', $5, $6)
    `,
    [
      "f3000000-0000-4000-8000-000000000019",
      "10000000-0000-4000-8000-000000000001",
      "seed-seller-mikkel",
      "seed-seller-anna",
      "mikkel@example.invalid",
      "Denne henvendelse kobler reservationen til sikkerhedstestens cykeloverdragelse.",
    ],
  );
  await ownershipTransferClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-anna"],
  );
  const transferReservation = await ownershipTransferClient.query(
    "select public.reserve_listing_for_contact($1::uuid) as reservation_id",
    ["f3000000-0000-4000-8000-000000000019"],
  );
  const transferReservationId =
    transferReservation.rows[0]?.reservation_id;
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
       and event.to_status = 'sold'
      where listing.id = $1::uuid
      limit 1
    `,
    ["10000000-0000-4000-8000-000000000001"],
  );
  const transferredReservation = await ownershipTransferClient.query(
    `
      select
        reservation.status,
        reservation.ended_by,
        request.status as request_status
      from public.listing_reservations reservation
      join public.contact_requests request
        on request.id = reservation.contact_request_id
      where reservation.id = $1::uuid
    `,
    [transferReservationId],
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
      transferredListing.rows[0]?.from_status === "reserved" &&
      transferredListing.rows[0]?.to_status === "sold",
    "Den aktive annonce blev ikke afsluttet med auditspor ved overdragelsen.",
  );
  assert(
    transferReservationId &&
      transferredReservation.rows[0]?.status === "completed" &&
      transferredReservation.rows[0]?.ended_by === "seed-seller-anna" &&
      transferredReservation.rows[0]?.request_status === "closed",
    "Cykeloverdragelsen afsluttede ikke reservation og henvendelse.",
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

try {
  await applicationDatabase.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      select public.moderate_ownership_document(
        ${"30000000-0000-4000-8000-000000000001"}::uuid,
        'approve',
        'Må ikke kunne godkendes af sælgeren.'
      )
    `,
  ]);
  throw new Error("En almindelig bruger kunne behandle ejerskabsdokumentation.");
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
      update public.ownership_documents
      set review_note = review_note
      where id = ${"30000000-0000-4000-8000-000000000001"}::uuid
    `,
  ]);
  throw new Error("En sælger kunne opdatere dokumentets reviewfelter direkte.");
} catch (error) {
  const expected =
    error instanceof Error &&
    error.message.includes("permission denied");
  if (!expected) throw error;
}

const ownershipReviewClient = createDatabaseClient();

try {
  await ownershipReviewClient.connect();
  await ownershipReviewClient.query("begin");
  await ownershipReviewClient.query(
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
        'road'::public.bike_category,
        $4,
        $5,
        $6,
        $7,
        'good'::public.listing_condition,
        $8,
        $9,
        $10::date
      )
    `,
    [
      "f0000000-0000-4000-8000-000000000017",
      "seed-seller-anna",
      "Midlertidig cykel til ejerskabskontrol",
      "Test",
      "Review",
      "56",
      12_500,
      "Aarhus",
      "Denne annonce bruges kun til at kontrollere det atomiske ejerskabsflow.",
      "2026-01-01",
    ],
  );
  await ownershipReviewClient.query(
    `
      insert into public.listing_images (
        id,
        listing_id,
        object_key,
        image_url,
        alt_text,
        position
      )
      values ($1::uuid, $2::uuid, $3, $4, $5, 0)
    `,
    [
      "f1000000-0000-4000-8000-000000000017",
      "f0000000-0000-4000-8000-000000000017",
      "security/ownership-review/image.webp",
      "https://example.com/security/ownership-review/image.webp",
      "Midlertidigt testbillede",
    ],
  );
  await ownershipReviewClient.query(
    `
      insert into public.ownership_documents (
        id,
        listing_id,
        owner_id,
        object_key,
        frame_number_hash
      )
      values ($1::uuid, $2::uuid, $3, $4, $5)
    `,
    [
      "f2000000-0000-4000-8000-000000000017",
      "f0000000-0000-4000-8000-000000000017",
      "seed-seller-anna",
      "security/ownership-review/document.pdf",
      "security-review-frame-hash",
    ],
  );
  await ownershipReviewClient.query("set local role cykelbasen_app");
  await ownershipReviewClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-mikkel"],
  );
  const otherSellerSubmission = await ownershipReviewClient.query(
    "select public.submit_listing_for_review($1::uuid) as submitted",
    ["f0000000-0000-4000-8000-000000000017"],
  );
  assert(
    otherSellerSubmission.rows[0]?.submitted === false,
    "En anden sælger kunne indsende ejerens annonce til kontrol.",
  );
  await ownershipReviewClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-anna"],
  );
  const submittedListing = await ownershipReviewClient.query(
    "select public.submit_listing_for_review($1::uuid) as submitted",
    ["f0000000-0000-4000-8000-000000000017"],
  );
  const submissionAudit = await ownershipReviewClient.query(
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
    ["f0000000-0000-4000-8000-000000000017"],
  );

  assert(
    submittedListing.rows[0]?.submitted === true &&
      submissionAudit.rows[0]?.status === "pending_review" &&
      submissionAudit.rows[0]?.actor_id === "seed-seller-anna" &&
      submissionAudit.rows[0]?.from_status === "draft" &&
      submissionAudit.rows[0]?.to_status === "pending_review",
    "Sælgerens indsendelse fik ikke korrekt status og auditspor.",
  );

  await ownershipReviewClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-moderator"],
  );
  const reviewedDocument = await ownershipReviewClient.query(
    `
      select public.moderate_ownership_document(
        $1::uuid,
        'approve',
        $2
      ) as reviewed
    `,
    [
      "f2000000-0000-4000-8000-000000000017",
      "Dokumentationen matcher annoncen og kan godkendes.",
    ],
  );
  const reviewAudit = await ownershipReviewClient.query(
    `
      select
        document.status as document_status,
        document.reviewed_by,
        document.reviewed_at is not null as has_review_timestamp,
        listing.status as listing_status,
        listing.published_at is not null as has_publication_timestamp,
        event.actor_id,
        event.from_status,
        event.to_status
      from public.ownership_documents document
      join public.listings listing on listing.id = document.listing_id
      join public.listing_status_events event
        on event.listing_id = listing.id
      where document.id = $1::uuid
        and event.to_status = 'published'
      limit 1
    `,
    ["f2000000-0000-4000-8000-000000000017"],
  );

  assert(
    reviewedDocument.rows[0]?.reviewed === true &&
      reviewAudit.rows[0]?.document_status === "approved" &&
      reviewAudit.rows[0]?.reviewed_by === "seed-moderator" &&
      reviewAudit.rows[0]?.has_review_timestamp === true &&
      reviewAudit.rows[0]?.listing_status === "published" &&
      reviewAudit.rows[0]?.has_publication_timestamp === true,
    "Godkendelse opdaterede ikke dokument og annonce atomisk.",
  );
  assert(
    reviewAudit.rows[0]?.actor_id === "seed-moderator" &&
      reviewAudit.rows[0]?.from_status === "pending_review" &&
      reviewAudit.rows[0]?.to_status === "published",
    "Ejerskabsgodkendelsen fik ikke et korrekt publicerings-auditspor.",
  );

  await ownershipReviewClient.query("rollback");
} catch (error) {
  await ownershipReviewClient.query("rollback").catch(() => {});
  throw error;
} finally {
  await ownershipReviewClient.end();
}

const contactStatusClient = createDatabaseClient();

try {
  await contactStatusClient.connect();
  await contactStatusClient.query("begin");
  await contactStatusClient.query("set local role cykelbasen_app");
  await contactStatusClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-mikkel"],
  );
  const sellerStatusUpdate = await contactStatusClient.query(
    `
      update public.contact_requests
      set status = 'read'
      where id = $1::uuid
      returning status, read_at is not null as has_read_at
    `,
    ["b0000000-0000-4000-8000-000000000001"],
  );
  await contactStatusClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-anna"],
  );
  const buyerStatusUpdate = await contactStatusClient.query(
    `
      update public.contact_requests
      set status = 'closed'
      where id = $1::uuid
      returning id
    `,
    ["b0000000-0000-4000-8000-000000000001"],
  );

  assert(
    sellerStatusUpdate.rows[0]?.status === "read" &&
      sellerStatusUpdate.rows[0]?.has_read_at === true,
    "Sælgeren kunne ikke markere henvendelsen som læst.",
  );
  assert(
    buyerStatusUpdate.rows.length === 0,
    "Køberen kunne ændre sælgerens indbakkestatus.",
  );
  await contactStatusClient.query("rollback");
} catch (error) {
  await contactStatusClient.query("rollback").catch(() => {});
  throw error;
} finally {
  await contactStatusClient.end();
}

const unauthorizedReservationResults = await applicationDatabase.transaction(
  (transaction) => [
    transaction`select set_config('app.user_id', ${"seed-seller-anna"}, true)`,
    transaction`
      select public.reserve_listing_for_contact(
        ${"b0000000-0000-4000-8000-000000000001"}::uuid
      ) as reservation_id
    `,
  ],
);

assert(
  unauthorizedReservationResults[1][0]?.reservation_id === null,
  "Køberen kunne reservere sælgerens annonce på egen hånd.",
);

const reservationClient = createDatabaseClient();

try {
  await reservationClient.connect();
  await reservationClient.query("begin");
  await reservationClient.query("set local role cykelbasen_app");
  await reservationClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-mikkel"],
  );
  const firstReservation = await reservationClient.query(
    "select public.reserve_listing_for_contact($1::uuid) as reservation_id",
    ["b0000000-0000-4000-8000-000000000001"],
  );
  const firstReservationId = firstReservation.rows[0]?.reservation_id;
  const reservedAudit = await reservationClient.query(
    `
      select
        reservation.status as reservation_status,
        listing.status as listing_status,
        request.status as request_status,
        event.actor_id,
        event.from_status,
        event.to_status
      from public.listing_reservations reservation
      join public.listings listing on listing.id = reservation.listing_id
      join public.contact_requests request
        on request.id = reservation.contact_request_id
      join public.listing_status_events event
        on event.listing_id = listing.id
       and event.to_status = 'reserved'
      where reservation.id = $1::uuid
      limit 1
    `,
    [firstReservationId],
  );

  assert(
    firstReservationId &&
      reservedAudit.rows[0]?.reservation_status === "active" &&
      reservedAudit.rows[0]?.listing_status === "reserved" &&
      reservedAudit.rows[0]?.request_status === "read",
    "Reservationen opdaterede ikke aftale, annonce og henvendelse atomisk.",
  );
  assert(
    reservedAudit.rows[0]?.actor_id === "seed-seller-mikkel" &&
      reservedAudit.rows[0]?.from_status === "published" &&
      reservedAudit.rows[0]?.to_status === "reserved",
    "Reservationen fik ikke et korrekt auditspor.",
  );

  await reservationClient.query(
    "select set_config('app.user_id', $1, true)",
    ["security-test-other"],
  );
  const unrelatedReservationRead = await reservationClient.query(
    "select count(*)::int as count from public.listing_reservations where id = $1::uuid",
    [firstReservationId],
  );
  assert(
    unrelatedReservationRead.rows[0]?.count === 0,
    "En uvedkommende bruger kunne læse en privat reservation.",
  );

  await reservationClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-anna"],
  );
  const buyerCancellation = await reservationClient.query(
    "select public.cancel_listing_reservation($1::uuid) as cancelled",
    [firstReservationId],
  );
  const cancelledReservation = await reservationClient.query(
    `
      select
        reservation.status,
        reservation.ended_by,
        reservation.ended_at is not null as has_ended_at,
        listing.status as listing_status
      from public.listing_reservations reservation
      join public.listings listing on listing.id = reservation.listing_id
      where reservation.id = $1::uuid
    `,
    [firstReservationId],
  );

  assert(
    buyerCancellation.rows[0]?.cancelled === true &&
      cancelledReservation.rows[0]?.status === "cancelled" &&
      cancelledReservation.rows[0]?.ended_by === "seed-seller-anna" &&
      cancelledReservation.rows[0]?.has_ended_at === true &&
      cancelledReservation.rows[0]?.listing_status === "published",
    "Køberens frigivelse genåbnede ikke annoncen med korrekt auditdata.",
  );

  await reservationClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-mikkel"],
  );
  const secondReservation = await reservationClient.query(
    "select public.reserve_listing_for_contact($1::uuid) as reservation_id",
    ["b0000000-0000-4000-8000-000000000001"],
  );
  const secondReservationId = secondReservation.rows[0]?.reservation_id;
  const completedSale = await reservationClient.query(
    `
      select public.set_seller_listing_status(
        $1::uuid,
        'sold'::public.listing_status
      ) as changed
    `,
    ["10000000-0000-4000-8000-000000000002"],
  );
  const completedReservation = await reservationClient.query(
    `
      select
        reservation.status,
        reservation.ended_by,
        listing.status as listing_status,
        request.status as request_status
      from public.listing_reservations reservation
      join public.listings listing on listing.id = reservation.listing_id
      join public.contact_requests request
        on request.id = reservation.contact_request_id
      where reservation.id = $1::uuid
    `,
    [secondReservationId],
  );

  assert(
    secondReservationId &&
      completedSale.rows[0]?.changed === true &&
      completedReservation.rows[0]?.status === "completed" &&
      completedReservation.rows[0]?.ended_by === "seed-seller-mikkel" &&
      completedReservation.rows[0]?.listing_status === "sold" &&
      completedReservation.rows[0]?.request_status === "closed",
    "Et gennemført salg afsluttede ikke reservation og henvendelse atomisk.",
  );

  await reservationClient.query("rollback");
} catch (error) {
  await reservationClient.query("rollback").catch(() => {});
  throw error;
} finally {
  await reservationClient.end();
}

const rateLimitClient = createDatabaseClient();

try {
  await rateLimitClient.connect();
  await rateLimitClient.query("begin");
  await rateLimitClient.query("set local role cykelbasen_app");
  await rateLimitClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-anna"],
  );

  for (let index = 0; index < 6; index += 1) {
    await rateLimitClient.query(
      `
        insert into public.forum_posts (
          category_slug,
          author_id,
          title,
          body
        )
        values ($1, $2, $3, $4)
      `,
      [
        "vedligeholdelse",
        "seed-seller-anna",
        `Midlertidig rate limit-test ${index}`,
        "Dette midlertidige forumindlæg bruges kun til at kontrollere databasebaseret rate limiting.",
      ],
    );
  }

  await rateLimitClient.query("rollback");
  throw new Error("Forumets databasebaserede rate limit blev ikke håndhævet.");
} catch (error) {
  await rateLimitClient.query("rollback").catch(() => {});
  const expected =
    error instanceof Error &&
    error.message.includes("RATE_LIMIT:forum-post");
  if (!expected) throw error;
} finally {
  await rateLimitClient.end();
}

const storagePolicyClient = createDatabaseClient();

try {
  await storagePolicyClient.connect();
  await storagePolicyClient.query("begin");
  await storagePolicyClient.query("set local role cykelbasen_app");
  await storagePolicyClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-anna"],
  );

  const temporaryListing = await storagePolicyClient.query(
    `
      insert into public.listings (
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
        $1,
        'Midlertidig storage-sikkerhedstest',
        'road',
        'Test',
        'Storage',
        '56',
        10000,
        'good',
        'Aarhus',
        'Midlertidig kladde til test af billed- og dokumentpolitikker.',
        current_date
      )
      returning id
    `,
    ["seed-seller-anna"],
  );
  const temporaryListingId = temporaryListing.rows[0]?.id;
  assert(temporaryListingId, "Storage-testen kunne ikke oprette en kladde.");

  const firstImage = await storagePolicyClient.query(
    `
      insert into public.listing_images (
        listing_id,
        object_key,
        image_url,
        alt_text,
        position,
        content_type,
        size_bytes
      )
      values ($1::uuid, $2, $3, 'Testbillede 1', 0, 'image/webp', 100)
      returning id
    `,
    [
      temporaryListingId,
      `security-test/${temporaryListingId}/one.webp`,
      `https://example.invalid/${temporaryListingId}/one.webp`,
    ],
  );
  const secondImage = await storagePolicyClient.query(
    `
      insert into public.listing_images (
        listing_id,
        object_key,
        image_url,
        alt_text,
        position,
        content_type,
        size_bytes
      )
      values ($1::uuid, $2, $3, 'Testbillede 2', 1, 'image/webp', 100)
      returning id
    `,
    [
      temporaryListingId,
      `security-test/${temporaryListingId}/two.webp`,
      `https://example.invalid/${temporaryListingId}/two.webp`,
    ],
  );
  const firstImageId = firstImage.rows[0]?.id;
  const secondImageId = secondImage.rows[0]?.id;

  const movedImage = await storagePolicyClient.query(
    "select public.move_listing_image($1::uuid, 'up') as moved",
    [secondImageId],
  );
  const orderedImages = await storagePolicyClient.query(
    `
      select id
      from public.listing_images
      where listing_id = $1::uuid
      order by position
    `,
    [temporaryListingId],
  );
  assert(
    movedImage.rows[0]?.moved === true &&
      orderedImages.rows[0]?.id === secondImageId,
    "Ejeren kunne ikke ændre billedrækkefølgen atomisk.",
  );

  await storagePolicyClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-mikkel"],
  );
  const otherMove = await storagePolicyClient.query(
    "select public.move_listing_image($1::uuid, 'down') as moved",
    [secondImageId],
  );
  assert(
    otherMove.rows[0]?.moved === false,
    "En anden bruger kunne ændre billedrækkefølgen.",
  );

  await storagePolicyClient.query(
    "select set_config('app.user_id', $1, true)",
    ["seed-seller-anna"],
  );
  const deletedImage = await storagePolicyClient.query(
    "select public.delete_listing_image($1::uuid) as object_key",
    [firstImageId],
  );
  const remainingPosition = await storagePolicyClient.query(
    `
      select position
      from public.listing_images
      where listing_id = $1::uuid
    `,
    [temporaryListingId],
  );
  assert(
    deletedImage.rows[0]?.object_key?.endsWith("/one.webp") &&
      remainingPosition.rows[0]?.position === 0,
    "Billedsletning bevarede ikke en sammenhængende rækkefølge.",
  );

  const document = await storagePolicyClient.query(
    `
      insert into public.ownership_documents (
        listing_id,
        owner_id,
        object_key,
        original_filename,
        content_type,
        size_bytes
      )
      values ($1::uuid, $2, $3, 'proof.pdf', 'application/pdf', 200)
      returning id
    `,
    [
      temporaryListingId,
      "seed-seller-anna",
      `security-test/${temporaryListingId}/proof.pdf`,
    ],
  );
  const deletedDocument = await storagePolicyClient.query(
    "select public.delete_ownership_document($1::uuid) as object_key",
    [document.rows[0]?.id],
  );
  assert(
    deletedDocument.rows[0]?.object_key?.endsWith("/proof.pdf"),
    "Ejeren kunne ikke erstatte afventende privat dokumentation.",
  );

  await storagePolicyClient.query("rollback");
} catch (error) {
  await storagePolicyClient.query("rollback").catch(() => {});
  throw error;
} finally {
  await storagePolicyClient.end();
}

console.log(
  "Security tests passed: storage policies/reordering, bike maintenance planning, listing reservations, ownership review/publication, contact privacy/status, database rate limits, marketplace reports/moderation, ownership transfer/privacy, favorites, forum RLS and audit invariants.",
);
