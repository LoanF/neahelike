import "server-only";
import { asc } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import type { Business } from "@/db/schema";
import { factionNames } from "./factions";

/** Une seule lecture de la table par requête, quel que soit le filtre demandé ensuite. */
const loadBusinesses = cache(async (): Promise<Business[]> => {
  try {
    return await db().select().from(schema.businesses).orderBy(asc(schema.businesses.sortOrder), asc(schema.businesses.name));
  } catch (error) {
    console.error("Lecture des entreprises impossible", error);
    return [];
  }
});

/** Entreprises à reprendre, triées ; les archivées seulement sur demande. */
export async function getBusinesses(includeArchived = false): Promise<Business[]> {
  return (await loadBusinesses()).filter(row => includeArchived || !row.archived);
}

/** Nom de chaque cible de reprise possible (affinités, créatures, entreprises), pour les libellés de dossier. */
export async function takeoverNames(): Promise<Record<string, string>> {
  const [factions, businesses] = await Promise.all([factionNames(), getBusinesses(true)]);
  return { ...factions, ...Object.fromEntries(businesses.map(business => [business.id, business.name])) };
}
