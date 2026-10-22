import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import type { BlacklistEntry } from "@/db/schema";

/**
 * Entrée de blacklist d'un ID Discord, ou `null`. La table est partagée avec le bot :
 * quelqu'un blacklisté depuis Discord est bloqué dès sa première connexion au site.
 */
export const getBlacklistEntry = cache(async (discordId: string): Promise<BlacklistEntry | null> => {
  const [entry] = await db().select().from(schema.blacklist).where(eq(schema.blacklist.discordId, discordId));
  return entry ?? null;
});

/** Tous les IDs blacklistés (badges de la liste de l'équipe). */
export async function blacklistedIds(): Promise<Set<string>> {
  const rows = await db().select({ discordId: schema.blacklist.discordId }).from(schema.blacklist);
  return new Set(rows.map(row => row.discordId));
}
