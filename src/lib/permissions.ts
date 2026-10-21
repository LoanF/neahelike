import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { PERMANENT_OWNER_IDS } from "@/content/owners";
import { db, schema } from "@/db";
import type { Rank } from "@/db/schema";
import { env } from "./env";
import { logEvent } from "./events";

/** Rang qu'un rôle Discord peut donner : le rang owner ne passe jamais par un rôle. */
export type RoleRank = "joueur" | "recruteur" | "admin";
const RANK_WEIGHT: Record<RoleRank, number> = { joueur: 0, recruteur: 1, admin: 2 };

/** Owners permanents (code) et owners ajoutés depuis le site (base). */
export const ownerIds = cache(async (): Promise<string[]> => {
  const rows = await db().select({ id: schema.siteOwners.discordId }).from(schema.siteOwners);
  return [...new Set([...PERMANENT_OWNER_IDS, ...rows.map(row => row.id)])];
});

export function isPermanentOwner(discordId: string) {
  return PERMANENT_OWNER_IDS.includes(discordId);
}

/**
 * Rang de chaque rôle Discord. Tant qu'aucun owner n'a rien réglé sur le site, on lit encore
 * les variables d'environnement (DISCORD_ROLE_ADMIN / DISCORD_ROLE_RECRUTEUR).
 */
export const roleRanks = cache(async (): Promise<{ ranks: Map<string, RoleRank>; source: "site" | "vercel" }> => {
  const rows = await db().select().from(schema.roleRanks);
  if (rows.length > 0) return { ranks: new Map(rows.map(row => [row.roleId, row.rank as RoleRank])), source: "site" };

  const { DISCORD_ROLE_ADMIN, DISCORD_ROLE_STAFF, DISCORD_ROLE_RECRUTEUR } = env();
  const ranks = new Map<string, RoleRank>();
  for (const id of DISCORD_ROLE_RECRUTEUR ?? []) ranks.set(id, "recruteur");
  for (const id of DISCORD_ROLE_ADMIN ?? DISCORD_ROLE_STAFF ?? []) ranks.set(id, "admin");
  return { ranks, source: "vercel" };
});

/** Owner s'il est dans la liste, sinon le plus haut rang donné par ses rôles Discord. */
export async function rankFor(discordId: string, roles: string[]): Promise<Rank> {
  if ((await ownerIds()).includes(discordId)) return "owner";
  const { ranks } = await roleRanks();
  let best: RoleRank = "joueur";
  for (const role of roles) {
    const rank = ranks.get(role);
    if (rank && RANK_WEIGHT[rank] > RANK_WEIGHT[best]) best = rank;
  }
  return best;
}

/** Les rangs de tout le monde seront relus depuis Discord à la prochaine page vue. */
async function resyncEveryone() {
  await db().update(schema.users).set({ rolesSyncedAt: null });
}

/** Enregistre tout le tableau des rôles (les rôles « joueur » ne sont pas stockés). */
export async function saveRoleRanks(next: Record<string, RoleRank>, names: Record<string, string>, ownerId: string) {
  const { ranks: previous } = await roleRanks();
  const entries = Object.entries(next).filter(([, rank]) => rank !== "joueur") as [string, "recruteur" | "admin"][];

  await db().transaction(async tx => {
    await tx.delete(schema.roleRanks);
    if (entries.length > 0) await tx.insert(schema.roleRanks).values(entries.map(([roleId, rank]) => ({ roleId, rank, updatedById: ownerId })));
  });

  const changed = new Set([...previous.keys(), ...Object.keys(next)]);
  for (const roleId of changed) {
    const before = previous.get(roleId) ?? "joueur";
    const after = next[roleId] ?? "joueur";
    if (before !== after) await logEvent({ type: "role.rang", subjectId: null, actorId: ownerId, data: { role: roleId, nom: names[roleId] ?? roleId, avant: before, apres: after } });
  }
  await resyncEveryone();
}

export async function addOwner(discordId: string, ownerId: string) {
  await db().insert(schema.siteOwners).values({ discordId, addedById: ownerId }).onConflictDoNothing();
  await db().update(schema.users).set({ rolesSyncedAt: null }).where(eq(schema.users.id, discordId));
  await logEvent({ type: "owner.ajoute", subjectId: null, actorId: ownerId, data: { owner: discordId } });
}

export async function removeOwner(discordId: string, ownerId: string) {
  if (isPermanentOwner(discordId)) return { error: "Cet owner est permanent : il ne peut pas être retiré." };
  await db().delete(schema.siteOwners).where(eq(schema.siteOwners.discordId, discordId));
  await db().update(schema.users).set({ rolesSyncedAt: null }).where(eq(schema.users.id, discordId));
  await logEvent({ type: "owner.retire", subjectId: null, actorId: ownerId, data: { owner: discordId } });
  return { ok: true as const };
}
