"use server";

import { redirect } from "next/navigation";
import type { FieldErrors } from "@/lib/application";
import { RATE_LIMIT_MESSAGE, rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";
import { cancelWipe, isWipeStep, saveWipeDraft, saveWipeStep, startWipe, submitWipe, WIPE_STEPS } from "@/lib/wipes";

/** Le joueur commence sa demande de wipe (après accord d'un admin sur son ticket Discord). */
export async function startWipeAction() {
  const user = await requireUser();
  if (!(await rateLimit("start", user.id))) redirect("/portail/wipe?erreur=limite");
  const result = await startWipe(user.id);
  if ("error" in result) redirect("/portail/wipe?erreur=demarrage");
  redirect("/portail/wipe/rp");
}

export async function autosaveWipeStep(step: string, values: unknown): Promise<{ ok: true } | { error: string }> {
  if (!isWipeStep(step)) return { error: "Étape inconnue." };
  const user = await requireUser();
  if (!(await rateLimit("autosave", user.id))) return { error: RATE_LIMIT_MESSAGE };
  return saveWipeDraft(user.id, step, values);
}

/** « Suivant » : personnage, puis background, puis la page d'envoi. */
export async function submitWipeStep(step: string, values: unknown): Promise<{ errors: FieldErrors } | { next: string }> {
  if (!isWipeStep(step)) return { errors: { form: "Étape inconnue." } };
  const user = await requireUser();
  if (!(await rateLimit("step", user.id))) return { errors: { form: RATE_LIMIT_MESSAGE } };
  const result = await saveWipeStep(user.id, step, values);
  if ("errors" in result) return result;
  const next = WIPE_STEPS[WIPE_STEPS.indexOf(step) + 1];
  return { next: next ? `/portail/wipe/${next}` : "/portail/wipe" };
}

export async function sendWipeAction() {
  const user = await requireUser();
  if (!(await rateLimit("send", user.id))) redirect("/portail/wipe?erreur=limite");
  const result = await submitWipe(user.id);
  redirect(`/portail/wipe?${"error" in result ? "erreur=envoi" : "envoyee=1"}`);
}

export async function cancelWipeAction() {
  const user = await requireUser();
  if (!(await rateLimit("send", user.id))) redirect("/portail/wipe?erreur=limite");
  await cancelWipe(user.id);
  redirect("/portail/wipe?annulee=1");
}
