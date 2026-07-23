import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDatabaseClient } from "./db-client.mjs";

if (
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production"
) {
  throw new Error("Development seed må aldrig køres i et produktionsmiljø.");
}

if (process.env.ALLOW_DEVELOPMENT_SEED !== "true") {
  throw new Error(
    "Sæt ALLOW_DEVELOPMENT_SEED=true lokalt for at bekræfte development seed.",
  );
}

const client = createDatabaseClient();

try {
  const statement = await readFile(
    resolve(process.cwd(), "db/seed.sql"),
    "utf8",
  );
  await client.connect();
  await client.query(statement);
  console.log("Kørte development seed.");
} catch (error) {
  console.error(
    error instanceof Error ? `Development seed fejlede: ${error.message}` : error,
  );
  process.exitCode = 1;
} finally {
  await client.end();
}

