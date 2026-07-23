# Operations runbook

Last reviewed: 2026-07-23.

## Monitoring baseline

Use `/api/health` for an external uptime check every minute. Alert after two
consecutive `503` responses and recover after two consecutive `200` responses.
The route checks the restricted runtime database connection and exposes no
credentials or database details.

In Vercel:

- enable production logs and Observability for request failures and latency
- alert on elevated 5xx rate and sustained p95 latency
- never log form bodies, e-mail addresses, frame numbers, object keys or signed
  document URLs
- inspect failed server actions after each deployment

In Neon:

- review compute usage, connection count, query latency, storage growth, local
  file-cache hit rate and working-set size weekly
- inspect slow queries and confirm new filter paths have an index
- verify `cykelbasen_app` remains non-owner and without `BYPASSRLS`
- run `pnpm test:security` after every authorization migration

In-app notifications are implemented for buyer inquiries and ownership review.
Due maintenance is calculated from current bike data. E-mail delivery is not
active until a mail provider, retry queue and retention policy are selected.

## Monthly Neon restore rehearsal

Do not rehearse by overwriting production.

1. Record the UTC start time, migration count and representative row counts for
   `profiles`, `listings`, `garage_bikes`, `bike_documents` and
   `forum_posts`.
2. In Neon, confirm **Settings → Restore window** covers the agreed recovery
   point objective.
3. Create an isolated point-in-time branch from 15–60 minutes earlier.
4. Create a temporary compute for that branch and connect with separate
   credentials.
5. Run read-only checks: expected tables exist, latest migration matches the
   chosen timestamp, row counts are plausible, and a known listing and bike
   registration can be read.
6. Record time-to-branch and time-to-verification as recovery-time evidence.
7. Delete the temporary compute and branch after sign-off.
8. Store the date, operator, recovery timestamp, RPO, RTO, checks and result in
   the incident/operations log.

For an actual incident, use Neon's Time Travel Assist to verify the selected
timestamp before restoring. Changing production is a two-person decision.

## Blob recovery rehearsal

Neon restore does not restore Blob objects.

1. Export an inventory by querying object keys and checksums/size metadata from
   Neon using owner credentials in a controlled operator session.
2. Keep an encrypted, access-logged secondary copy of private documents in an
   approved EU-region archive before public launch.
3. Quarterly, restore one public image and one synthetic private PDF into a
   disposable store.
4. Verify byte size, media type and application preview authorization.
5. Delete the disposable copies and record the result.

Until the secondary archive is provisioned and tested, permanent Blob deletion
is an acknowledged recovery gap.

Official references: [Neon restore window](https://neon.com/docs/manage/projects),
[Neon branching and recovery](https://neon.com/docs/guides/branching-intro) and
[Vercel Observability](https://vercel.com/docs/observability).
