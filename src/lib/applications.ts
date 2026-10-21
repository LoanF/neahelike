import "server-only";
import { and, desc, eq, notInArray } from "drizzle-orm";
import { cache } from "react";
import { REAPPLY_DELAY_MONTHS } from "@/content/candidature";
import { AFFINITY_AVAILABILITY, CREATURE_AVAILABILITY } from "@/content/availability";
import type { AffinityId, CreatureId } from "@/content/lore";
import { db, schema } from "@/db";
import type { Application, ApplicationStatus, StepValues } from "@/db/schema";
import { logEvent } from "./events";
import type { DataStepId, FieldErrors } from "./application";
import { DATA_STEPS, draftSchema, fieldErrors, isStepComplete, isStepEditable, parseStep, STEP_FIELDS, visibleSteps } from "./application";

const CLOSED_STATUSES: ApplicationStatus[] = ["whitelistee", "refusee"];

/** Statuts dans lesquels le joueur peut encore modifier ses réponses. */
export function isEditable(application: Pick<Application, "status">) {
  return application.status === "brouillon" || application.status === "a_modifier";
}

/** Candidature en cours (une seule possible), ou null. */
export const getOpenApplication = cache(async (userId: string): Promise<Application | null> => {
  const [row] = await db()
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.userId, userId), notInArray(schema.applications.status, CLOSED_STATUSES)));
  return row ?? null;
});

/** Dernière candidature, ouverte ou non (pour afficher un refus ou une whitelist). */
export const getLatestApplication = cache(async (userId: string): Promise<Application | null> => {
  const [row] = await db()
    .select()
    .from(schema.applications)
    .where(eq(schema.applications.userId, userId))
    .orderBy(desc(schema.applications.createdAt))
    .limit(1);
  return row ?? null;
});

export function reapplyDate(application: Pick<Application, "decidedAt">) {
  if (!application.decidedAt) return null;
  const date = new Date(application.decidedAt);
  date.setMonth(date.getMonth() + REAPPLY_DELAY_MONTHS);
  return date;
}

export type StartBlock = { reason: "whitelistee" } | { reason: "delai"; until: Date } | null;

/** Raison pour laquelle le joueur ne peut pas commencer une nouvelle candidature. */
export function startBlock(latest: Application | null): StartBlock {
  if (!latest) return null;
  if (latest.status === "whitelistee") return { reason: "whitelistee" };
  if (latest.status === "refusee") {
    const until = reapplyDate(latest);
    if (until && until > new Date()) return { reason: "delai", until };
  }
  return null;
}

export async function startApplication(userId: string): Promise<Application | { error: string }> {
  const open = await getOpenApplication(userId);
  if (open) return open;
  const block = startBlock(await getLatestApplication(userId));
  if (block?.reason === "whitelistee") return { error: "Tu es déjà whitelisté." };
  if (block?.reason === "delai") return { error: `Tu pourras recandidater à partir du ${block.until.toLocaleDateString("fr-FR")}.` };

  const [created] = await db().insert(schema.applications).values({ userId }).onConflictDoNothing().returning();
  // Double clic : la contrainte « une candidature ouverte » a gardé la première.
  if (!created) return (await getOpenApplication(userId)) ?? { error: "Impossible de créer la candidature." };
  await logEvent({ type: "candidature.commencee", subjectId: userId });
  return created;
}

/** Ne garde que les champs de l'étape, sans valider leur contenu. */
function cleanDraft(step: DataStepId, values: unknown): StepValues | null {
  const parsed = draftSchema(step).safeParse(values);
  if (!parsed.success) return null;
  return Object.fromEntries(STEP_FIELDS[step].map(field => [field, (parsed.data as StepValues)[field] ?? null]));
}

export async function saveDraft(application: Application, step: DataStepId, values: unknown) {
  if (!isEditable(application) || !isStepEditable(application, step)) return { error: "Cette partie n'est plus modifiable." };
  const draft = cleanDraft(step, values);
  if (!draft) return { error: "Brouillon invalide." };
  await db().update(schema.applications).set({ [step]: draft }).where(eq(schema.applications.id, application.id));
  return { ok: true as const };
}

/** Places closes : une affinité ou une créature fermée ne peut pas être choisie. */
function availabilityErrors(step: DataStepId, values: StepValues): FieldErrors {
  const errors: FieldErrors = {};
  if (step === "rp") {
    const affinity = values.affinity as AffinityId | "";
    const creature = values.creature as CreatureId | "";
    if (affinity && AFFINITY_AVAILABILITY[affinity] === false) errors.affinity = "Cette affinité n'accepte plus de nouveaux membres pour le moment.";
    if (creature && CREATURE_AVAILABILITY[creature] === false) errors.creature = "Cette créature n'accepte plus de nouveaux membres pour le moment.";
  }
  return errors;
}

/** Valide l'étape et l'enregistre. Les valeurs sont gardées même invalides, pour ne rien perdre. */
export async function saveStep(application: Application, step: DataStepId, values: unknown): Promise<{ errors: FieldErrors } | { ok: true; values: StepValues }> {
  if (!isEditable(application) || !isStepEditable(application, step)) return { errors: { form: "Cette partie n'est plus modifiable." } };
  const draft = cleanDraft(step, values);
  if (!draft) return { errors: { form: "Formulaire invalide." } };

  await db().update(schema.applications).set({ [step]: draft }).where(eq(schema.applications.id, application.id));

  const parsed = parseStep(step, draft);
  const errors = { ...(parsed.success ? {} : fieldErrors(parsed.error)), ...availabilityErrors(step, draft) };
  if (Object.keys(errors).length > 0) return { errors };

  await logEvent({ type: "candidature.etape", subjectId: application.userId, data: { etape: step } });
  return { ok: true, values: draft };
}

/** Envoi final : toutes les étapes visibles doivent être complètes et les places encore ouvertes. */
export async function submitApplication(application: Application): Promise<{ error: string } | { ok: true }> {
  if (!isEditable(application)) return { error: "Ta candidature a déjà été envoyée." };
  const steps = visibleSteps(application).map(step => step.id);
  const incomplete = DATA_STEPS.filter(step => steps.includes(step) && !isStepComplete(application, step));
  if (incomplete.length > 0) return { error: "Certaines étapes sont incomplètes." };
  const closed = availabilityErrors("rp", application.rp ?? {});
  if (Object.keys(closed).length > 0) return { error: Object.values(closed)[0] };

  const resubmission = application.status === "a_modifier";
  await db()
    .update(schema.applications)
    .set({
      status: "envoyee",
      submittedAt: new Date(),
      // Nouvel envoi : l'équipe repart de « En attente de lecture ».
      viewedAt: null,
      // Dossier décoché après coup : on n'envoie pas un dossier que le joueur ne voit plus.
      ...(!steps.includes("dossier") && { dossier: null }),
    })
    .where(eq(schema.applications.id, application.id));
  await logEvent({ type: "candidature.envoyee", subjectId: application.userId, data: resubmission ? { renvoi: true } : {} });
  return { ok: true };
}
