import type { BadgeTone } from "@/components/plaque";

/** Badges vus par l'équipe. « En cours de lecture » est à part : c'est l'œil de présence, calculé en direct. */
export type TeamBadge = "aucune" | "brouillon" | "dossier" | "a_lire" | "vue" | "a_modifier" | "entretien" | "whitelistee" | "refusee";

export const BADGE_LABEL: Record<TeamBadge, string> = {
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

export const BADGE_TONE: Record<TeamBadge, BadgeTone> = {
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

export const TABS = [
  { id: "a-traiter", label: "À traiter", badges: ["a_lire", "vue"] },
  { id: "entretiens", label: "Entretiens", badges: ["entretien"] },
  { id: "modifications", label: "Modifications", badges: ["a_modifier"] },
  { id: "brouillons", label: "Brouillons", badges: ["brouillon", "dossier"] },
  { id: "validees", label: "Whitelistés", badges: ["whitelistee"] },
  { id: "refusees", label: "Refusées", badges: ["refusee"] },
  { id: "tous", label: "Tous", badges: null },
] as const satisfies readonly { id: string; label: string; badges: readonly TeamBadge[] | null }[];

export type TabId = (typeof TABS)[number]["id"];
