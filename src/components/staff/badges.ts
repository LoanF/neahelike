import type { BadgeTone } from "@/components/plaque";
import type { Application } from "@/db/schema";
import { isStepComplete, wantsDossier } from "@/lib/application";

/** Badges vus par l'équipe. « En cours de lecture » est à part : c'est l'œil de présence, calculé en direct. */
export type StaffBadge = "aucune" | "brouillon" | "dossier" | "a_lire" | "vue" | "a_modifier" | "entretien" | "whitelistee" | "refusee";

export const BADGE_LABEL: Record<StaffBadge, string> = {
  aucune: "Pas de candidature",
  brouillon: "Brouillon",
  dossier: "Dossier de reprise en attente",
  a_lire: "En attente de lecture",
  vue: "Vue",
  a_modifier: "Modification demandée",
  entretien: "Entretien vocal à passer",
  whitelistee: "Whitelisté",
  refusee: "Refusée",
};

export const BADGE_TONE: Record<StaffBadge, BadgeTone> = {
  aucune: "default",
  brouillon: "default",
  dossier: "gold",
  a_lire: "gold",
  vue: "default",
  a_modifier: "danger",
  entretien: "gold",
  whitelistee: "success",
  refusee: "danger",
};

export function staffBadge(application: Application | null): StaffBadge {
  if (!application) return "aucune";
  switch (application.status) {
    case "brouillon":
      return wantsDossier(application) && !isStepComplete(application, "dossier") ? "dossier" : "brouillon";
    case "envoyee":
      return application.viewedAt ? "vue" : "a_lire";
    default:
      return application.status;
  }
}

export const TABS = [
  { id: "a-traiter", label: "À traiter", badges: ["a_lire", "vue"] },
  { id: "entretiens", label: "Entretiens", badges: ["entretien"] },
  { id: "modifications", label: "Modifications", badges: ["a_modifier"] },
  { id: "brouillons", label: "Brouillons", badges: ["brouillon", "dossier"] },
  { id: "validees", label: "Whitelistés", badges: ["whitelistee"] },
  { id: "refusees", label: "Refusées", badges: ["refusee"] },
  { id: "tous", label: "Tous", badges: null },
] as const satisfies readonly { id: string; label: string; badges: readonly StaffBadge[] | null }[];

export type TabId = (typeof TABS)[number]["id"];
