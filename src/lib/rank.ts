import type { Rank } from "@/db/schema";

/*
 * Ordre des rangs, sans dépendance serveur : partagé par les gardes (lib/session.ts) et le menu (client).
 */
const RANK_ORDER: Record<Rank, number> = { joueur: 0, recruteur: 1, admin: 2, owner: 3 };

/** Chaque rang a toutes les permissions des rangs inférieurs : owner > admin > recruteur > joueur. */
export function hasRank(user: { rank: Rank }, minimum: Rank) {
  return RANK_ORDER[user.rank] >= RANK_ORDER[minimum];
}
