import { defineConfig } from "drizzle-kit";

// Schéma(s) Postgres gérés par Drizzle, séparés par des virgules (DB_SCHEMAS=public,autre).
const schemas = (process.env.DB_SCHEMAS ?? "public")
  .split(",")
  .map(schema => schema.trim())
  .filter(Boolean);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL_MIGRATIONS || process.env.DATABASE_URL || "" },
  schemaFilter: schemas,
  casing: "snake_case",
});
