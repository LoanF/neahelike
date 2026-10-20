import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { db?: Database };

function connect(): Database {
  // prepare: false pour le pooler Supabase (mode transaction).
  const client = postgres(env().DATABASE_URL, { prepare: false, max: 5 });
  return drizzle(client, { schema, casing: "snake_case" });
}

/** Connexion paresseuse, réutilisée entre les rechargements à chaud en dev. */
export function db(): Database {
  if (!globalForDb.db) globalForDb.db = connect();
  return globalForDb.db;
}

export { schema };
