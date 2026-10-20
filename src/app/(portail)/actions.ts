"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { CGU_VERSION } from "@/content/legal";
import { db, schema } from "@/db";
import { addRole } from "@/lib/discord";
import { env } from "@/lib/env";
import { logEvent } from "@/lib/events";
import { syncMember } from "@/lib/members";
import { getCurrentUser } from "@/lib/session";

export async function loginWithDiscord() {
  await signIn("discord", { redirectTo: "/liaison" });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

/** Accepte les CGU, donne le rôle « Initié » sur Discord et ouvre le portail. */
export async function acceptCgu(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (formData.get("cgu") !== "on") redirect("/liaison?erreur=cgu");

  const firstTime = !user.cguAcceptedAt;
  await db()
    .update(schema.users)
    .set({ cguAcceptedAt: new Date(), cguVersion: CGU_VERSION })
    .where(eq(schema.users.id, user.id));
  await logEvent({ type: "compte.cgu", subjectId: user.id, data: { version: CGU_VERSION } });

  if (firstTime) {
    try {
      await addRole(user.id, env().DISCORD_ROLE_INITIE, "Compte lié au portail Néa Hélikè");
      await logEvent({ type: "role.initie", subjectId: user.id });
    } catch (error) {
      // Le portail reste accessible : le rôle pourra être redonné par le bot.
      console.error("Attribution du rôle Initié impossible", error);
    }
  }

  redirect("/portail");
}

/** Relit la présence sur le serveur Discord (bouton « J'ai rejoint le serveur »). */
export async function recheckGuild() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const { inGuild } = await syncMember(user.id);
  redirect(inGuild ? "/liaison" : "/rejoindre-discord?erreur=absent");
}
