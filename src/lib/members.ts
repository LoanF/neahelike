import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Rank, User } from "@/db/schema";
import { getMember } from "./discord";
import { env } from "./env";
import { logEvent } from "./events";

/** Délai après lequel les rôles Discord sont relus. */
export const ROLES_TTL_MS = 5 * 60 * 1000;

/** Le rang découle uniquement des rôles Discord : staff > recruteur > joueur. */
export function rankFromRoles(roles: string[]): Rank {
  const { DISCORD_ROLE_STAFF, DISCORD_ROLE_RECRUTEUR } = env();
  if (roles.includes(DISCORD_ROLE_STAFF)) return "staff";
  if (roles.includes(DISCORD_ROLE_RECRUTEUR)) return "recruteur";
  return "joueur";
}

export function rolesAreStale(user: Pick<User, "rolesSyncedAt">) {
  return !user.rolesSyncedAt || Date.now() - user.rolesSyncedAt.getTime() > ROLES_TTL_MS;
}

/**
 * Relit le membre sur Discord et met à jour rang et présence.
 * Quitter le serveur ou perdre un rôle retire aussitôt les permissions correspondantes.
 */
export async function syncMember(userId: string): Promise<Pick<User, "rank" | "inGuild">> {
  const member = await getMember(userId);
  const inGuild = member !== null;
  const rank: Rank = member ? rankFromRoles(member.roles) : "joueur";

  const [previous] = await db().select({ rank: schema.users.rank, inGuild: schema.users.inGuild }).from(schema.users).where(eq(schema.users.id, userId));

  await db()
    .update(schema.users)
    .set({
      rank,
      inGuild,
      rolesSyncedAt: new Date(),
      ...(member && {
        username: member.user.username,
        globalName: member.user.global_name,
        avatar: member.user.avatar,
      }),
    })
    .where(eq(schema.users.id, userId));

  if (previous && previous.rank !== rank) {
    await logEvent({ type: "rang.change", subjectId: userId, data: { avant: previous.rank, apres: rank } });
  }
  if (previous && previous.inGuild !== inGuild) {
    await logEvent({ type: inGuild ? "discord.rejoint" : "discord.quitte", subjectId: userId });
  }

  return { rank, inGuild };
}
