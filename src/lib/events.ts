import "server-only";
import { db, schema } from "@/db";

/**
 * Types d'événements du journal. Le libellé et l'icône de chaque type
 * seront définis avec la chronologie du profil.
 */
export type EventType =
  | "compte.cree"
  | "compte.connexion"
  | "compte.cgu"
  | "compte.supprime"
  | "discord.rejoint"
  | "discord.quitte"
  | "rang.change"
  | "candidature.commencee"
  | "candidature.etape"
  | "candidature.envoyee"
  | "candidature.vue"
  | "candidature.validee"
  | "candidature.modification"
  | "candidature.refusee"
  | "candidature.supprimee"
  | "entretien.valide"
  | "note.ajoutee"
  | "role.rang"
  | "owner.ajoute"
  | "owner.retire"
  | "faction.ajoutee"
  | "faction.modifiee"
  | "entreprise.ajoutee"
  | "entreprise.modifiee"
  | "critere.ajoute"
  | "critere.modifie";

export async function logEvent(event: { type: EventType; subjectId: string | null; actorId?: string | null; data?: Record<string, unknown> }) {
  await db().insert(schema.events).values({
    type: event.type,
    subjectId: event.subjectId,
    actorId: event.actorId ?? event.subjectId,
    data: event.data ?? {},
  });
}
