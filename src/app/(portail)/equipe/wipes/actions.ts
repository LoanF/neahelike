"use server";

import { revalidatePath } from "next/cache";
import type { VerdictState } from "@/components/equipe/verdict-form";
import { RATE_LIMIT_MESSAGE, rateLimit } from "@/lib/rate-limit";
import { freshActor } from "@/lib/session";
import { decideWipe, inviteWipe } from "@/lib/wipes";

/** Valider ou refuser une demande de wipe (admins et owners). */
export async function decideWipeAction(_previous: VerdictState | null, formData: FormData): Promise<VerdictState> {
  const admin = await freshActor("admin");
  if (!admin) return { error: "Réservé aux admins.", at: Date.now() };
  if (!(await rateLimit("decision", admin.id))) return { error: RATE_LIMIT_MESSAGE, at: Date.now() };
  // Pas de rafraîchissement de la page : la demande reste affichée avec sa confirmation (et les avertissements Discord).
  const result = await decideWipe(String(formData.get("id") ?? ""), admin, formData.get("verdict") === "accepter", String(formData.get("comment") ?? ""));
  return { ...result, at: Date.now() };
}

export type InviteState = VerdictState | null;

/** Inviter un joueur whitelist à refaire son personnage : choisi dans la liste, ou par son ID Discord. */
export async function inviteWipeAction(_previous: InviteState, formData: FormData): Promise<InviteState> {
  const admin = await freshActor("admin");
  if (!admin) return { error: "Réservé aux admins.", at: Date.now() };
  if (!(await rateLimit("admin", admin.id))) return { error: RATE_LIMIT_MESSAGE, at: Date.now() };
  const typed = String(formData.get("discordId") ?? "").trim();
  const playerId = typed || String(formData.get("playerId") ?? "");
  if (!playerId) return { error: "Choisis un joueur dans la liste ou indique son ID Discord.", at: Date.now() };
  const result = await inviteWipe(playerId, admin);
  if ("ok" in result) revalidatePath("/equipe/wipes");
  return { ...result, at: Date.now() };
}
