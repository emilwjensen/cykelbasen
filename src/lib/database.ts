import "server-only";

import { neon } from "@neondatabase/serverless";

let database: ReturnType<typeof neon> | undefined;

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL er ikke konfigureret.");
  }

  database ??= neon(connectionString);
  return database;
}

