import "server-only";
import { asc } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import type { Business } from "@/db/schema";
import { factionNames } from "./factions";

/** Entreprises à reprendre, triées ; les archivées seulement sur demande. */
export const getBusinesses = cache(async (includeArchived = false): Promise<Business[]> => {
  try {
    const rows = await db().select().from(schema.businesses).orderBy(asc(schema.businesses.sortOrder), asc(schema.businesses.name));
    return rows.filter(row => includeArchived || !row.archived);
  } catch (error) {
    console.error("Lecture des entreprises impossible", error);
    return [];
  }
});

/** Nom de chaque cible de reprise possible (affinités, créatures, entreprises), pour les libellés de dossier. */
export async function takeoverNames(): Promise<Record<string, string>> {
  const [factions, businesses] = await Promise.all([factionNames(), getBusinesses(true)]);
  return { ...factions, ...Object.fromEntries(businesses.map(business => [business.id, business.name])) };
}
