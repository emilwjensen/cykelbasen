import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createDatabaseClient } from "./db-client.mjs";

const ownerUrl = process.env.DATABASE_URL;

if (!ownerUrl) {
  throw new Error("DATABASE_URL mangler.");
}

const password = randomBytes(36).toString("base64url");
const client = createDatabaseClient();

try {
  await client.connect();

  const quotedPassword = await client.query(
    "select quote_literal($1) as value",
    [password],
  );
  const passwordLiteral = quotedPassword.rows[0]?.value;

  if (typeof passwordLiteral !== "string") {
    throw new Error("Kunne ikke beskytte database-passwordet.");
  }

  await client.query(`
    alter role cykelbasen_app
      with login
      password ${passwordLiteral}
  `);

  const applicationUrl = new URL(ownerUrl);
  applicationUrl.username = "cykelbasen_app";
  applicationUrl.password = password;

  const envPath = ".env";
  const source = readFileSync(envPath, "utf8");
  const line = `DATABASE_APP_URL="${applicationUrl.toString()}"`;
  const next = /^DATABASE_APP_URL=.*$/m.test(source)
    ? source.replace(/^DATABASE_APP_URL=.*$/m, line)
    : `${source.trimEnd()}\n${line}\n`;

  writeFileSync(envPath, next, { mode: 0o600 });
  console.log("Restricted application role configured in Neon and .env.");
} catch (error) {
  console.error(
    error instanceof Error
      ? `Application role setup failed: ${error.message}`
      : error,
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
