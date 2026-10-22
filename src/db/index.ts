import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { db?: Database };

/** `max_pipeline` est lu par postgres-js mais absent de ses types. */
type ClientOptions = postgres.Options<Record<string, never>> & { max_pipeline: number };

function connect(): Database {
  const options: ClientOptions = {
    // Pooler Supabase en mode transaction : pas de requêtes préparées.
    prepare: false,
    // Pas de requête de découverte des types à chaque nouvelle connexion : le schéma n'a que des tableaux de texte,
    // connus d'avance. Derrière le pooler, les requêtes mises en file derrière celle-ci pouvaient rester bloquées.
    fetch_types: false,
    // Une seule requête à la fois par connexion. Par défaut postgres-js en enchaîne jusqu'à 100 sans attendre
    // les réponses ; le pooler en mode transaction perd alors certaines réponses et la page attend sans fin.
    max_pipeline: 0,
    max: 5,
    // Sur Vercel, une fonction peut dormir entre deux visites : une connexion restée ouverte peut
    // mourir sans prévenir et bloquer la requête suivante. On les ferme vite et on ne les garde pas longtemps.
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
  };
  const client = postgres(env().DATABASE_URL, options);
  return drizzle(client, { schema, casing: "snake_case" });
}

/** Connexion paresseuse, réutilisée entre les rechargements à chaud en dev. */
export function db(): Database {
  if (!globalForDb.db) globalForDb.db = connect();
  return globalForDb.db;
}

export { schema };
