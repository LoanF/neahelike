import type { AffinityId, CreatureId } from "./lore";

/*
 * Places ouvertes ou closes. Valeurs par défaut du site public :
 * l'administration les pilotera depuis la base de données.
 */
export const CREATURE_AVAILABILITY: Record<CreatureId, boolean> = {
  minotaures: true,
  colosses: true,
  centaures: true,
  sirenes: true,
  satyres: true,
};

export const AFFINITY_AVAILABILITY: Record<AffinityId, boolean> = {
  fendeciels: true,
  abyssiens: true,
  toxotes: true,
  ardents: true,
  guerriers: true,
};
