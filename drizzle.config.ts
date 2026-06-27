import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.PGHOST!,
    user: process.env.PGUSER || "admin",
    database: process.env.PGDATABASE || "postgres",
    port: Number(process.env.PGPORT || 5432),
    ssl: true,
  },
});
