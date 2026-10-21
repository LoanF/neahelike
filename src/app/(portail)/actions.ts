"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { CGU_VERSION } from "@/content/legal";
import { db, schema } from "@/db";
import { logEvent } from "@/lib/events";
import { syncMember } from "@/lib/members";
import { latestNotifications, markAllRead } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";

export async function loginWithDiscord() {
  await signIn("discord", { redirectTo: "/liaison" });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

/**
 * Accepte les CGU et ouvre le portail. Aucun rôle Discord n'est donné ici :
 * « attente de wl » arrive quand la candidature est validée, le rôle whitelist après le vocal.
 */
export async function acceptCgu(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (formData.get("cgu") !== "on") redirect("/liaison?erreur=cgu");

  await db()
    .update(schema.users)
    .set({ cguAcceptedAt: new Date(), cguVersion: CGU_VERSION })
    .where(eq(schema.users.id, user.id));
  await logEvent({ type: "compte.cgu", subjectId: user.id, data: { version: CGU_VERSION } });

  redirect("/portail");
}

/** Relit la présence sur le serveur Discord (bouton « J'ai rejoint le serveur »). */
export async function recheckGuild() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const { inGuild } = await syncMember(user.id);
  redirect(inGuild ? "/liaison" : "/rejoindre-discord?erreur=absent");
}

/** Cloche : dernières notifications du joueur connecté. */
export async function fetchNotifications() {
  const user = await getCurrentUser();
  if (!user) return { items: [], unread: 0 };
  return latestNotifications(user.id);
}

/** Ouverture de la cloche : tout est marqué comme lu. */
export async function markNotificationsRead() {
  const user = await getCurrentUser();
  if (user) await markAllRead(user.id);
}
