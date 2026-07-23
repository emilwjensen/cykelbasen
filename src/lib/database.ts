import "server-only";

import { neon } from "@neondatabase/serverless";

let database: ReturnType<typeof neon> | undefined;
let applicationDatabase: ReturnType<typeof neon> | undefined;

export function getDatabase() {
  const connectionString =
    process.env.DATABASE_APP_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL er ikke konfigureret.");
  }

  database ??= neon(connectionString);
  return database;
}

export function getApplicationDatabase() {
  const connectionString = process.env.DATABASE_APP_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_APP_URL mangler. Kør pnpm db:setup-app-role.",
    );
  }

  applicationDatabase ??= neon(connectionString);
  return applicationDatabase;
}
