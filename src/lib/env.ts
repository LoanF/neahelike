import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_DISCORD_ID: z.string().min(1),
  AUTH_DISCORD_SECRET: z.string().min(1),
  DISCORD_BOT_TOKEN: z.string().min(1),
  DISCORD_GUILD_ID: z.string().regex(/^\d+$/),
  DISCORD_ROLE_RECRUTEUR: z.string().regex(/^\d+$/),
  DISCORD_ROLE_STAFF: z.string().regex(/^\d+$/),
  DISCORD_ROLE_INITIE: z.string().regex(/^\d+$/),
  DISCORD_ROLE_ASPIRANT: z.string().regex(/^\d+$/).optional(),
  DISCORD_ROLE_HELIKEEN: z.string().regex(/^\d+$/).optional(),
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
