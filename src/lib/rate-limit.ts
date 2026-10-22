import "server-only";
import { lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Limites par membre : nombre d'appels autorisés sur une fenêtre (en secondes).
 * Larges pour un usage normal, elles ne bloquent que les clics répétés ou les scripts.
 */
export const LIMITS = {
  cgu: { max: 5, window: 60 },
  discord: { max: 6, window: 60 },
  start: { max: 5, window: 60 },
  autosave: { max: 90, window: 60 },
  step: { max: 30, window: 60 },
  send: { max: 5, window: 60 },
  decision: { max: 20, window: 60 },
  note: { max: 10, window: 60 },
  noteDelete: { max: 20, window: 60 },
  accountDelete: { max: 5, window: 60 },
  sanction: { max: 10, window: 60 },
  admin: { max: 60, window: 60 },
} as const;

export type LimitName = keyof typeof LIMITS;

export const RATE_LIMIT_MESSAGE = "Trop d'actions d'affilée : patiente une minute avant de recommencer.";

/** Purge des compteurs expirés, une fois sur cinquante environ pour ne pas alourdir chaque appel. */
const PURGE_RATE = 0.02;

/**
 * Compte un appel et dit s'il reste sous la limite. Le compteur vit en base : il tient même quand
 * Vercel répartit les requêtes sur plusieurs instances. Si la base ne répond pas, on laisse passer
 * (l'action elle-même échouera proprement).
 */
export async function rateLimit(name: LimitName, userId: string): Promise<boolean> {
  const { max, window } = LIMITS[name];
  const key = `${name}:${userId}`;
  try {
    const [row] = await db()
      .insert(schema.rateLimits)
      .values({ key, count: 1, resetAt: sql`now() + make_interval(secs => ${window})` })
      .onConflictDoUpdate({
        target: schema.rateLimits.key,
        set: {
          count: sql`case when ${schema.rateLimits.resetAt} <= now() then 1 else ${schema.rateLimits.count} + 1 end`,
          resetAt: sql`case when ${schema.rateLimits.resetAt} <= now() then excluded.reset_at else ${schema.rateLimits.resetAt} end`,
        },
      })
      .returning({ count: schema.rateLimits.count });
    if (Math.random() < PURGE_RATE) await db().delete(schema.rateLimits).where(lt(schema.rateLimits.resetAt, sql`now()`));
    return row.count <= max;
  } catch (error) {
    console.error("[rate-limit]", error);
    return true;
  }
}
