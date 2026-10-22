import type { BadgeTone } from "@/components/plaque";
import type { ApplicationStatus } from "@/db/schema";

/** Libellés vus par le joueur. Les badges de l'équipe (vue, en lecture…) sont dans components/equipe/badges.ts. */
export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  a_modifier: "Modification demandée",
  entretien: "Entretien vocal à passer",
  whitelistee: "Whitelist",
  refusee: "Refusée",
};

export const STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  brouillon: "default",
  envoyee: "gold",
  a_modifier: "danger",
  entretien: "gold",
  whitelistee: "success",
  refusee: "danger",
};

/** Étape du parcours (voir JOURNEY) où en est le joueur. */
export function journeyIndex(status: ApplicationStatus | null) {
  switch (status) {
    case "envoyee":
      return 1;
    case "entretien":
      return 2;
    case "whitelistee":
      return 3;
    default:
      return 0;
  }
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}
