import "server-only";
import { eq } from "drizzle-orm";
import { redirect, unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { CGU_VERSION } from "@/content/legal";
import { db, schema } from "@/db";
import type { Rank, User } from "@/db/schema";
import { getBlacklistEntry } from "./blacklist";
import { rolesAreStale, syncMember } from "./members";
import { hasRank } from "./rank";

export { hasRank } from "./rank";

/**
 * Utilisateur connecté, avec rôles Discord relus s'ils datent de plus de 5 minutes.
 * Mis en cache pour la durée d'une requête.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const load = async () => (await db().select().from(schema.users).where(eq(schema.users.id, id)))[0] ?? null;
  // La blacklist est lue en même temps (mise en cache pour la requête) : requireUser la consulte juste après.
  const [user] = await Promise.all([load(), getBlacklistEntry(id)]);
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

const JUST_SYNCED_MS = 5_000;

/** Droits relus sur Discord avant toute action sensible : un rôle retiré il y a une minute ne permet plus d'agir. */
export async function requireFreshRank(minimum: Rank) {
  const user = await requireUser({ rank: "recruteur" });
  // Rang relu à l'instant par getCurrentUser (rôles périmés) : inutile de rappeler Discord une seconde fois.
  const justSynced = !!user.rolesSyncedAt && Date.now() - user.rolesSyncedAt.getTime() < JUST_SYNCED_MS;
  // Si Discord ne répond pas, on refuse plutôt que de se fier à un rang qui date peut-être de 5 minutes.
  const { rank } = justSynced ? user : await syncMember(user.id);
  if (!hasRank({ rank }, minimum)) throw new Error("Permissions insuffisantes.");
  return { ...user, rank };
}

/**
 * Garde des Server Actions de l'équipe : le membre avec son rang relu sur Discord, ou `null` s'il n'a pas
 * (ou plus) le rang demandé, ou si Discord ne répond pas. Une redirection (session expirée) n'est pas avalée.
 */
export async function freshActor(minimum: Rank) {
  try {
    return await requireFreshRank(minimum);
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
