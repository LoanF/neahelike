"use server";

import { redirect } from "next/navigation";
import type { DataStepId, FieldErrors } from "@/lib/application";
import { currentStep, DATA_STEPS, nextStep, stepHref } from "@/lib/application";
import { getOpenApplication, saveDraft, saveStep, startApplication, submitApplication } from "@/lib/applications";
import { RATE_LIMIT_MESSAGE, rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";

function assertStep(step: string): asserts step is DataStepId {
  if (!DATA_STEPS.includes(step as DataStepId)) throw new Error(`Étape inconnue : ${step}`);
}

export async function startCandidature() {
  const user = await requireUser();
  if (!(await rateLimit("start", user.id))) redirect("/portail/candidature?erreur=limite");
  const result = await startApplication(user.id);
  // Codes seulement dans l'adresse : la page affiche le texte correspondant (pas de texte libre injectable par un lien).
  if ("error" in result) redirect("/portail/candidature?erreur=demarrage");
  redirect(stepHref(currentStep(result)));
}

/** Enregistrement automatique pendant la saisie. */
export async function autosaveStep(step: string, values: unknown): Promise<{ ok: true } | { error: string }> {
  assertStep(step);
  const user = await requireUser();
  if (!(await rateLimit("autosave", user.id))) return { error: RATE_LIMIT_MESSAGE };
  const application = await getOpenApplication(user.id);
  if (!application) return { error: "Aucune candidature en cours." };
  return saveDraft(application, step, values);
}

/** Bouton « Suivant » : valide l'étape, puis indique la suivante. */
export async function submitStep(step: string, values: unknown): Promise<{ errors: FieldErrors } | { next: string }> {
  assertStep(step);
  const user = await requireUser();
  if (!(await rateLimit("step", user.id))) return { errors: { form: RATE_LIMIT_MESSAGE } };
  const application = await getOpenApplication(user.id);
  if (!application) return { errors: { form: "Aucune candidature en cours." } };

  const result = await saveStep(application, step, values);
  if ("errors" in result) return result;

  // Avec les nouvelles valeurs : la case « dossier » de l'étape HRP change la liste des étapes.
  return { next: stepHref(nextStep({ ...application, [step]: result.values }, step)) };
}

export async function sendCandidature(formData: FormData) {
  const user = await requireUser();
  const application = await getOpenApplication(user.id);
  if (!application) redirect("/portail/candidature");
  if (formData.get("certify") !== "on") redirect(`${stepHref("recapitulatif")}?erreur=certify`);
  if (!(await rateLimit("send", user.id))) redirect(`${stepHref("recapitulatif")}?erreur=limite`);

  const result = await submitApplication(application);
  if ("error" in result) redirect(`${stepHref("recapitulatif")}?erreur=envoi`);
  redirect("/portail/candidature?envoyee=1");
}
