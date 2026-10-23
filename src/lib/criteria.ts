import "server-only";
import { asc } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import type { RefusalCriterion } from "@/db/schema";

/** Critère « Autre » : il demande toujours un commentaire. */
export const OTHER_CRITERION = "autre";

/** Une seule lecture de la table par requête, quel que soit le filtre demandé ensuite. */
const loadCriteria = cache(() => db().select().from(schema.refusalCriteria).orderBy(asc(schema.refusalCriteria.sortOrder)));

/** Critères de refus triés ; les désactivés seulement sur demande (administration). */
export async function getCriteria(includeInactive = false): Promise<RefusalCriterion[]> {
  return (await loadCriteria()).filter(row => includeInactive || row.active);
}

/** Libellé de chaque critère, désactivés compris, pour relire les anciens refus. */
export async function criteriaLabels(): Promise<Record<string, string>> {
  return Object.fromEntries((await getCriteria(true)).map(row => [row.id, row.label]));
}
