import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createDatabaseClient } from "./db-client.mjs";

const migrationsDirectory = join(process.cwd(), "db", "migrations");
const client = createDatabaseClient();

try {
  await client.connect();
  await client.query(`
    create table if not exists public.schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const migrationNames = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const name of migrationNames) {
    const existing = await client.query(
      "select 1 from public.schema_migrations where name = $1",
      [name],
    );

    if (existing.rowCount) {
      console.log(`Springer over ${name}`);
      continue;
    }

    const migration = await readFile(join(migrationsDirectory, name), "utf8");

    await client.query("begin");
    try {
      await client.query(migration);
      await client.query(
        "insert into public.schema_migrations (name) values ($1)",
        [name],
      );
      await client.query("commit");
      console.log(`Anvendte ${name}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} catch (error) {
  console.error(
    error instanceof Error ? `Migration fejlede: ${error.message}` : error,
  );
  process.exitCode = 1;
} finally {
  await client.end();
}

