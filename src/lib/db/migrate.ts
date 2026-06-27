import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { withConnection } from "./index";

const MIGRATIONS_DIR = join(process.cwd(), "drizzle", "migrations");

async function ensureMigrationsTable(client: import("pg").PoolClient) {
  await client.query("BEGIN");
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function getAppliedMigrations(
  client: import("pg").PoolClient
): Promise<Set<string>> {
  const result = await client.query<{ name: string }>(
    "SELECT name FROM schema_migrations"
  );
  return new Set(result.rows.map((r) => r.name));
}

async function applyMigration(
  client: import("pg").PoolClient,
  name: string,
  sql: string
) {
  console.log(`Applying migration: ${name}`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
      name,
    ]);
    await client.query("COMMIT");
    console.log(`✓ Applied: ${name}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function pollAsyncIndexes(client: import("pg").PoolClient) {
  console.log("Polling async index jobs...");
  for (let i = 0; i < 30; i++) {
    const result = await client.query(
      "SELECT job_id, status FROM sys.jobs WHERE status != 'COMPLETED'"
    );
    if (result.rows.length === 0) {
      console.log("✓ All async index jobs completed");
      return;
    }
    console.log(
      `  Waiting... ${result.rows.length} jobs pending`,
      result.rows.map((r) => `${r.job_id}: ${r.status}`).join(", ")
    );
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.warn("⚠ Some index jobs may still be running");
}

export async function runMigrations() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  await withConnection(async (client) => {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping (already applied): ${file}`);
        continue;
      }
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8").trim();
      await applyMigration(client, file, sql);
    }

    const hasAsyncIndexes = files.some(
      (f) => f.includes("idx_") && !applied.has(f)
    );
    if (hasAsyncIndexes) {
      await pollAsyncIndexes(client);
    }
  });

  console.log("Migrations complete.");
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
