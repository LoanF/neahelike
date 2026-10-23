import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { db?: Database; tx?: Database };

/** `max_pipeline` est lu par postgres-js mais absent de ses types. */
type ClientOptions = postgres.Options<Record<string, never>> & { max_pipeline?: number };

function connect(extra: ClientOptions): Database {
  const options: ClientOptions = {
    // Pooler Supabase en mode transaction : pas de requêtes préparées.
    prepare: false,
    // Pas de requête de découverte des types à chaque nouvelle connexion : le schéma n'a que des tableaux de texte,
    // connus d'avance. Derrière le pooler, les requêtes mises en file derrière celle-ci pouvaient rester bloquées.
    fetch_types: false,
    // Sur Vercel, une fonction peut dormir entre deux visites : une connexion restée ouverte peut
    // mourir sans prévenir et bloquer la requête suivante. On les ferme vite et on ne les garde pas longtemps.
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
    ...extra,
  };
  const client = postgres(env().DATABASE_URL, options);
  return drizzle(client, { schema, casing: "snake_case" });
}

/**
 * Connexion paresseuse, réutilisée entre les rechargements à chaud en dev.
 * Une seule requête à la fois par connexion : par défaut postgres-js en enchaîne jusqu'à 100 sans attendre
 * les réponses, et le pooler en mode transaction perd alors certaines réponses (la page attend sans fin).
 * Ce réglage interdit `db().transaction()` : les transactions passent par `transaction()` ci-dessous.
 */
export function db(): Database {
  globalForDb.db ??= connect({ max_pipeline: 0, max: 5 });
  return globalForDb.db;
}

/**
 * Transaction sur une connexion dédiée (une seule, comme postgres-js l'exige). Pendant une transaction,
 * le pooler garde la même connexion au serveur : y enchaîner les requêtes est sans risque.
 */
export const transaction: Database["transaction"] = (work, config) => {
  globalForDb.tx ??= connect({ max: 1 });
  return globalForDb.tx.transaction(work, config);
};

export { schema };
