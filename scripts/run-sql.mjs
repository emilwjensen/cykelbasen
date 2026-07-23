import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDatabaseClient } from "./db-client.mjs";

const sqlPath = process.argv[2];

if (!sqlPath) {
  throw new Error("Angiv en SQL-fil, f.eks. db/seed.sql.");
}

const client = createDatabaseClient();

try {
  const statement = await readFile(resolve(process.cwd(), sqlPath), "utf8");
  await client.connect();
  await client.query(statement);
  console.log(`Kørte ${sqlPath}`);
} catch (error) {
  console.error(
    error instanceof Error ? `SQL-kørsel fejlede: ${error.message}` : error,
  );
  process.exitCode = 1;
} finally {
  await client.end();
}

