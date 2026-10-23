import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { CGU_VERSION } from "@/content/legal";
import { db, schema } from "@/db";
import type { Rank, User } from "@/db/schema";
import { getBlacklistEntry } from "./blacklist";
import { rolesAreStale, syncMember } from "./members";

const RANK_ORDER: Record<Rank, number> = { joueur: 0, recruteur: 1, admin: 2, owner: 3 };

/** Chaque rang a toutes les permissions des rangs inférieurs : owner > admin > recruteur > joueur. */
export function hasRank(user: Pick<User, "rank">, minimum: Rank) {
  return RANK_ORDER[user.rank] >= RANK_ORDER[minimum];
}

/**
 * Utilisateur connecté, avec rôles Discord relus s'ils datent de plus de 5 minutes.
 * Mis en cache pour la durée d'une requête.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const load = async () => (await db().select().from(schema.users).where(eq(schema.users.id, id)))[0] ?? null;
  const user = await load();
  if (!user) return null;
  if (!rolesAreStale(user)) return user;

  try {
    await syncMember(id);
  } catch (error) {
    // Discord indisponible : on garde les dernières valeurs connues plutôt que de bloquer le portail.
    console.error("Synchronisation des rôles impossible", error);
    return user;
  }
  return load();
});

/** CGU acceptées dans leur version actuelle. */
export function hasAcceptedCgu(user: Pick<User, "cguAcceptedAt" | "cguVersion">) {
  return !!user.cguAcceptedAt && user.cguVersion === CGU_VERSION;
}

interface Requirements {
  /** CGU acceptées (toutes les pages du portail sauf la liaison). */
  cgu?: boolean;
  rank?: Rank;
}

/** Garde des pages du portail : redirige selon l'état du compte. */
export async function requireUser({ cgu = true, rank }: Requirements = {}): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  // Avant tout le reste : un joueur blacklisté n'a accès qu'à sa page de blocage.
  if (await getBlacklistEntry(user.id)) redirect("/blacklist");
  if (!user.inGuild) redirect("/rejoindre-discord");
  if (cgu && !hasAcceptedCgu(user)) redirect("/liaison");
  if (rank && !hasRank(user, rank)) redirect("/portail");
  return user;
}

/** Droits relus sur Discord avant toute action sensible : un rôle retiré il y a une minute ne permet plus d'agir. */
export async function requireFreshRank(minimum: Rank) {
  const user = await requireUser({ rank: "recruteur" });
  // Si Discord ne répond pas, on refuse plutôt que de se fier à un rang qui date peut-être de 5 minutes.
  const { rank } = await syncMember(user.id);
  if (!hasRank({ rank }, minimum)) throw new Error("Permissions insuffisantes.");
  return { ...user, rank };
}
