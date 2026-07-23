# Cykelbasen

Cykelbasen er en dansk markedsplads for brugte racercykler. Den første
vertikale slice gør publicerede annoncer søgbare på strukturerede
specifikationer og håndhæver i databasen, at ejerskab skal være godkendt før
publicering.

## Stack

- Next.js App Router og TypeScript
- Neon Postgres via `@neondatabase/serverless`
- SQL-migrationer uden ORM
- Tailwind CSS
- Vercel og GitHub Actions
- pnpm

Neon Auth, profiler og sælgerkladder er integreret. Vercel Blob bruges som
separate offentlige og private stores til listing-billeder og
ejerskabsdokumenter.

## Lokal opstart

Krav: Node.js 22+ og pnpm via Corepack.

```bash
corepack enable
pnpm install
cp .env.example .env
```

Tilføj den poolede Neon-forbindelse som `DATABASE_URL` i `.env`, og kør:

```bash
pnpm db:migrate
pnpm db:setup-app-role
ALLOW_DEVELOPMENT_SEED=true pnpm db:seed
pnpm dev
```

Åbn `http://localhost:3000`.

## Vercel Blob

Opret to Blob stores i Vercel:

1. En public store til annoncebilleder.
2. En private store til ejerskabsdokumenter.

Tilføj deres separate tokens i `.env`:

```bash
LISTING_IMAGES_BLOB_READ_WRITE_TOKEN="..."
OWNERSHIP_DOCUMENTS_BLOB_READ_WRITE_TOKEN="..."
```

Tokens må ikke have adgang til hinandens store. Uploadformularerne viser en
konfigurationsbesked, indtil de er sat.

## Kommandoer

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm check
pnpm test:security
pnpm test:e2e
pnpm db:migrate
pnpm db:setup-app-role
pnpm db:seed
pnpm db:moderator -- grant AUTH_USER_ID
```

`db:seed` kræver `ALLOW_DEVELOPMENT_SEED=true` og afviser production-miljøer.
Det indeholder udelukkende udviklingsdata. De fire eksempelannoncer
publiceres gennem samme database-trigger som rigtige annoncer og har hver en
godkendt udviklings-dokumentpost.

## Aktuel funktionalitet

- Dansk offentlig forside
- `/cykler` med URL-baseret søgning, filtre og sortering
- Annoncekort og detaljeside
- Loading-, empty-, not-found- og error-states
- Neon-migration med RLS, filterindekser og publicerings-trigger
- Neon Auth med oprettelse, login og logout
- Profil samt sælgerdashboard
- Opret og redigér annoncekladder med server-side Zod-validering
- Begrænset `cykelbasen_app`-rolle uden `BYPASSRLS`
- Forumkategorier samt sortering efter nyeste og score
- Opret og redigér forumindlæg
- Kommentarer, ét niveau af svar og private bruger-stemmer
- Rapportér indlæg og kommentarer én gang per bruger
- Moderator-kø med atomisk hide og auditspor
- Brand- og størrelsesdropdowns samt interaktivt prisinterval
- URL-baseret pagination med stabil database-sortering
- Sammenlign op til tre publicerede cykler side om side uden konto
- Købsdato, ejerantal og dokumentationssignaler på annoncer
- Struktureret historik for udskiftede komponenter
- Privat “Mine cykler” med hash af stelnummer
- Standardiseret mærkevalg, tekniske specs og private købsdata i cykelpasset
- Private kvitteringer, købsaftaler, garanti-, forsikrings- og servicebilag
- Kilometer-, service-, tur- og komponentlogs
- Auditvenlige logrettelser samt pensionering uden tab af ejerhistorik
- Vedligeholdelsesplaner efter dato eller kilometer med automatisk logning
- Redigering, annullering og 30-dages udsættelse af påmindelser
- Forudfyld salgsannonce fra en registreret cykel
- Sammenhængende ejerperioder via sikker overdragelseskode
- Adskilte private logs for hver ejer efter videresalg
- Private favoritter med køberoverblik
- Aktive filterchips med individuel fjernelse
- Sælgerflow til solgt og arkiveret med auditspor
- Rapportér mistænkelige annoncer til en privat moderator-kø
- Moderatorfjernelse af annoncer med atomisk auditspor
- Indsend annonce til ejerskabskontrol med databasevalideret readiness
- Privat moderator-kø til godkendelse eller afvisning af dokumentposter
- Atomisk publicering og auditspor efter godkendt ejerskab
- Strukturerede køberhenvendelser med eksplicit deling af kontomail
- Privat sælgerindbakke med læst- og afsluttet-status
- Køberoverblik og privat reservation bundet til en konkret henvendelse
- Frigivelse eller gennemført salg med atomisk annonce-audit
- Databasebaserede rate limits for kontakt, forum og rapportering
- Upload, rækkefølge og sletning af op til otte validerede annoncebilleder
- Privat dokumentupload med filsignaturkontrol og kortlivet preview
- Sikker moderator-provisionering uden ad hoc SQL
- Billedgalleri, sitemap, robots, structured data og beta-legal-sider
- Playwright browser-smoke og automatiske accessibility-kontroller
- Kontoeksport, verificeret kontosletning og in-app notifikationscenter

Følg `docs/VERCEL_BLOB_SETUP.md` for de to stores og
`docs/OPERATIONS_RUNBOOK.md` for monitoring og restoreøvelser. Resterende
launch-hardening følger i `docs/DELIVERY_PLAN.md`.
