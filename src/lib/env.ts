import "server-only";
import { z } from "zod";

const snowflake = z.string().regex(/^\d+$/);

/** Liste d'ID de rôles Discord séparés par des virgules : plusieurs rôles peuvent donner le même rang. */
const roleList = z
  .string()
  .transform(value => value.split(",").map(id => id.trim()).filter(Boolean))
  .pipe(z.array(snowflake).min(1));

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_DISCORD_ID: z.string().min(1),
  AUTH_DISCORD_SECRET: z.string().min(1),
  DISCORD_BOT_TOKEN: z.string().min(1),
  DISCORD_GUILD_ID: snowflake,
  /** Rôles par rang avant la configuration depuis le site (voir lib/permissions.ts). */
  DISCORD_ROLE_RECRUTEUR: roleList.optional(),
  DISCORD_ROLE_ADMIN: roleList.optional(),
  /** Ancien nom de DISCORD_ROLE_ADMIN, encore lu s'il est défini. */
  DISCORD_ROLE_STAFF: roleList.optional(),
  DISCORD_ROLE_ATTENTE_WL: snowflake.optional(),
  DISCORD_ROLE_WL: snowflake.optional(),
  DISCORD_ROLE_NON_WL: snowflake.optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Variables d'environnement serveur, validées au premier accès (pas au build). */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map(issue => issue.path.join(".")).join(", ");
    throw new Error(`Variables d'environnement invalides ou manquantes : ${missing}. Voir .env.example.`);
  }
  cached = parsed.data;
  return cached;
}
