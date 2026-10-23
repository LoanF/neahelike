"use server";

import type { FieldErrors } from "@/lib/application";
import { RATE_LIMIT_MESSAGE, rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";
import { saveDossierDraft, submitDossier } from "@/lib/takeovers";

/** Enregistrement automatique du dossier déposé à part. */
export async function autosaveDossier(_step: string, values: unknown): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();
  if (!(await rateLimit("autosave", user.id))) return { error: RATE_LIMIT_MESSAGE };
  return saveDossierDraft(user.id, values);
}

/** « Envoyer le dossier » : validé, puis transmis à l'équipe. */
export async function sendDossier(_step: string, values: unknown): Promise<{ errors: FieldErrors } | { next: string }> {
  const user = await requireUser();
  if (!(await rateLimit("send", user.id))) return { errors: { form: RATE_LIMIT_MESSAGE } };
  const result = await submitDossier(user.id, values);
  return "errors" in result ? result : { next: "/portail/dossier?envoye=1" };
}
