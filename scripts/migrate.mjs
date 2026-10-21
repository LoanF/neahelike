// Applique les migrations Drizzle (dossier drizzle/) avant le build de production.
// Lancé par `pnpm vercel-build` : Vercel l'utilise à la place de `build` quand il existe.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const env = process.env;
const production = env.VERCEL_ENV === "production" || env.MIGRATE_FORCE === "true";
const schemas = (env.DB_SCHEMAS ?? "public")
  .split(",")
  .map(schema => schema.trim())
  .filter(Boolean);

if (env.DB_AUTO_MIGRATE === "false") {
  console.log("[migrations] Désactivées (DB_AUTO_MIGRATE=false).");
  process.exit(0);
}
if (!production) {
  console.log(`[migrations] Ignorées hors production (VERCEL_ENV=${env.VERCEL_ENV ?? "local"}).`);
  process.exit(0);
}

const url = env.DATABASE_URL_MIGRATIONS || env.DATABASE_URL;
if (!url) {
  console.error("[migrations] DATABASE_URL manquante : impossible de mettre la base à jour.");
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

try {
  console.log(`[migrations] Schéma(s) géré(s) : ${schemas.join(", ")}`);
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  console.log("[migrations] Base à jour.");
} catch (error) {
  // Un échec arrête le déploiement : l'ancienne version du site reste en ligne.
  console.error("[migrations] Échec, déploiement interrompu.", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
