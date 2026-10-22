import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { db?: Database };

function connect(): Database {
  const client = postgres(env().DATABASE_URL, {
    // Pooler Supabase en mode transaction : pas de requêtes préparées.
    prepare: false,
    max: 5,
    // Sur Vercel, une fonction peut dormir entre deux visites : une connexion restée ouverte peut
    // mourir sans prévenir et bloquer la requête suivante. On les ferme vite et on ne les garde pas longtemps.
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
  });
  return drizzle(client, { schema, casing: "snake_case" });
}

/** Connexion paresseuse, réutilisée entre les rechargements à chaud en dev. */
export function db(): Database {
  if (!globalForDb.db) globalForDb.db = connect();
  return globalForDb.db;
}

export { schema };
