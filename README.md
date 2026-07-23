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

Neon Auth tilføjes i sælger-slicen. Listing-billeder og private
ejerskabsdokumenter kræver en separat object-storage integration; udbyderen er
ikke valgt endnu.

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
pnpm db:seed
pnpm dev
```

Åbn `http://localhost:3000`.

## Kommandoer

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm check
pnpm db:migrate
pnpm db:seed
```

`db:seed` indeholder udelukkende udviklingsdata. De fire eksempelannoncer
publiceres gennem samme database-trigger som rigtige annoncer og har hver en
godkendt udviklings-dokumentpost.

## Aktuel funktionalitet

- Dansk offentlig forside
- `/cykler` med URL-baseret søgning, filtre og sortering
- Annoncekort og detaljeside
- Loading-, empty-, not-found- og error-states
- Neon-migration med RLS, filterindekser og publicerings-trigger

Auth, sælgerflow, uploads, moderation-UI og forum følger som separate vertikale
slices.

