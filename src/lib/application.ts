/*
 * Structure de la candidature, partagée entre le formulaire (client) et les actions serveur.
 * Les valeurs sont stockées telles que saisies (chaînes et cases) : une étape est « complète »
 * quand ses valeurs passent le schéma strict, ce qui permet d'enregistrer un brouillon à tout moment.
 */
import { z } from "zod";
import { DOSSIER_KINDS, MIN_AGE_IRL } from "@/content/candidature";
import { AFFINITIES, CREATURES } from "@/content/lore";
import type { Application, StepValues } from "@/db/schema";

export const STEPS = [
  { id: "hrp", label: "HRP", title: "Toi, derrière l'écran" },
  { id: "rp", label: "Personnage", title: "Ton personnage" },
  { id: "background", label: "Background", title: "Son histoire" },
  { id: "dossier", label: "Dossier", title: "Dossier de reprise" },
  { id: "recapitulatif", label: "Récapitulatif", title: "Relire et envoyer" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];
/** Étapes qui portent des données (le récapitulatif n'en a pas). */
export type DataStepId = Exclude<StepId, "recapitulatif">;

export const DATA_STEPS: DataStepId[] = ["hrp", "rp", "background", "dossier"];

export function isStepId(value: string): value is StepId {
  return STEPS.some(step => step.id === value);
}

const REQUIRED = "Ce champ est obligatoire.";

/** Champ texte : un champ jamais touché (absent ou null) est signalé comme obligatoire. */
const filled = () => z.string({ error: REQUIRED }).trim().min(1, REQUIRED);

const text = (min: number, max: number, label: string) =>
  filled()
    .min(min, `${label} : ${min} caractères minimum.`)
    .max(max, `${label} : ${max} caractères maximum.`);

const integer = (min: number, max: number, label: string) =>
  filled()
    .regex(/^\d+$/, `${label} : indique un nombre.`)
    .transform(Number)
    .pipe(z.number().min(min, `${label} : ${min} minimum.`).max(max, `${label} : ${max} maximum.`));

const link = filled()
  .max(500, "Lien trop long.")
  .url("Ce lien n'est pas valide.")
  .refine(value => value.startsWith("https://"), "Le lien doit commencer par https://.");

const shared = z.literal(true, { error: "Confirme que le document est partagé en lecture." });

const AFFINITY_IDS = AFFINITIES.map(affinity => affinity.id) as [string, ...string[]];
const CREATURE_IDS = CREATURES.map(creature => creature.id) as [string, ...string[]];
const DOSSIER_KIND_IDS = DOSSIER_KINDS.map(kind => kind.id) as [string, ...string[]];

/** « Aucune » est enregistré comme chaîne vide. */
const optionalChoice = (ids: [string, ...string[]]) => z.union([z.literal(""), z.enum(ids)], { error: "Choisis une option dans la liste." });

export const STEP_SCHEMAS = {
  hrp: z.object({
    age: integer(MIN_AGE_IRL, 99, "L'âge"),
    rpHours: integer(0, 100000, "Les heures de RP"),
    experience: text(10, 2000, "L'expérience"),
    goodMic: z.boolean({ error: REQUIRED }),
    wantsDossier: z.boolean({ error: REQUIRED }),
  }),
  rp: z.object({
    firstName: text(2, 40, "Le prénom"),
    lastName: text(2, 40, "Le nom"),
    age: integer(18, 120, "L'âge du personnage"),
    origin: text(10, 1000, "L'origine"),
    affinity: optionalChoice(AFFINITY_IDS),
    creature: optionalChoice(CREATURE_IDS),
  }),
  background: z.object({
    url: link,
    shared,
  }),
  dossier: z
    .object({
      kind: z.enum(DOSSIER_KIND_IDS, { error: "Choisis ce que tu veux reprendre." }),
      target: z.string({ error: "Précise ce que tu veux reprendre." }).trim().min(1, "Précise ce que tu veux reprendre.").max(80, "80 caractères maximum."),
      url: link,
      shared,
    })
    .superRefine((value, ctx) => {
      const ids = value.kind === "affinite" ? AFFINITY_IDS : value.kind === "creature" ? CREATURE_IDS : null;
      if (ids && !ids.includes(value.target)) ctx.addIssue({ code: "custom", path: ["target"], message: "Choisis dans la liste." });
    }),
} satisfies Record<DataStepId, z.ZodType>;

export type StepData<S extends DataStepId> = z.output<(typeof STEP_SCHEMAS)[S]>;

/** Champs de chaque étape, pour filtrer les brouillons. */
export const STEP_FIELDS: Record<DataStepId, string[]> = {
  hrp: ["age", "rpHours", "experience", "goodMic", "wantsDossier"],
  rp: ["firstName", "lastName", "age", "origin", "affinity", "creature"],
  background: ["url", "shared"],
  dossier: ["kind", "target", "url", "shared"],
};

/** Brouillon : seulement les champs connus, sans validation de contenu. */
export function draftSchema(step: DataStepId) {
  const value = z.union([z.string().max(4000), z.boolean(), z.null()]).optional();
  return z.strictObject(Object.fromEntries(STEP_FIELDS[step].map(field => [field, value])));
}

export type FieldErrors = Record<string, string>;

export function parseStep<S extends DataStepId>(step: S, values: StepValues | null | undefined) {
  return STEP_SCHEMAS[step].safeParse(values ?? {}) as z.ZodSafeParseResult<StepData<S>>;
}

/** Premier message d'erreur par champ. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

type StepSource = Pick<Application, DataStepId> & Partial<Pick<Application, "status" | "changesSteps">>;

export function wantsDossier(application: StepSource | null) {
  return application?.hrp?.wantsDossier === true;
}

/** Étapes affichées pour cette candidature : le dossier n'apparaît que si la case a été cochée. */
export function visibleSteps(application: StepSource | null) {
  return STEPS.filter(step => step.id !== "dossier" || wantsDossier(application));
}

export function isStepComplete(application: StepSource | null, step: DataStepId) {
  return !!application && parseStep(step, application[step]).success;
}

function isChangeRequest(application: StepSource | null) {
  return application?.status === "a_modifier";
}

/**
 * Étapes modifiables. Après une demande de modification, seules les parties rouvertes par l'équipe le sont,
 * plus le dossier s'il vient d'être ajouté et n'est pas encore rempli.
 */
export function isStepEditable(application: StepSource | null, step: StepId) {
  if (!isChangeRequest(application) || step === "recapitulatif") return true;
  if (application?.changesSteps?.includes(step)) return true;
  return step === "dossier" && wantsDossier(application) && !isStepComplete(application, "dossier");
}

function editableSteps(application: StepSource | null) {
  return visibleSteps(application).filter(step => step.id !== "recapitulatif" && isStepEditable(application, step.id));
}

/** Première étape à remplir, ou le récapitulatif si tout est complet. */
export function currentStep(application: StepSource | null): StepId {
  if (isChangeRequest(application)) {
    const editable = editableSteps(application);
    const incomplete = editable.find(step => step.id !== "recapitulatif" && !isStepComplete(application, step.id));
    return (incomplete ?? editable[0])?.id ?? "recapitulatif";
  }
  for (const step of visibleSteps(application)) {
    if (step.id === "recapitulatif" || !isStepComplete(application, step.id)) return step.id;
  }
  return "recapitulatif";
}

/** Une étape n'est accessible que si toutes les précédentes sont complètes (et, après une demande de modification, si elle est rouverte). */
export function canAccessStep(application: StepSource | null, step: StepId) {
  const steps = visibleSteps(application);
  const index = steps.findIndex(item => item.id === step);
  if (index === -1) return false;
  if (isChangeRequest(application) && step !== "recapitulatif" && !isStepEditable(application, step)) return false;
  return steps.slice(0, index).every(item => item.id === "recapitulatif" || isStepComplete(application, item.id));
}

export function nextStep(application: StepSource | null, step: StepId): StepId {
  const steps = isChangeRequest(application) ? [...editableSteps(application), STEPS[STEPS.length - 1]] : visibleSteps(application);
  const index = steps.findIndex(item => item.id === step);
  return steps[Math.min(index + 1, steps.length - 1)].id;
}

/** Étape précédente modifiable, pour le bouton « Précédent ». */
export function previousStep(application: StepSource | null, step: StepId): StepId | null {
  const steps = isChangeRequest(application) ? [...editableSteps(application), STEPS[STEPS.length - 1]] : visibleSteps(application);
  const index = steps.findIndex(item => item.id === step);
  return index > 0 ? steps[index - 1].id : null;
}

export function stepHref(step: StepId) {
  return `/portail/candidature/${step}`;
}

/** Libellé de la cible d'un dossier de reprise (« Lead des Minotaures »). */
export function dossierTargetLabel(values: StepValues | null | undefined) {
  if (!values) return null;
  const target = typeof values.target === "string" ? values.target : "";
  if (values.kind === "affinite") return `Lead des ${AFFINITIES.find(item => item.id === target)?.name ?? target}`;
  if (values.kind === "creature") return `Lead des ${CREATURES.find(item => item.id === target)?.name ?? target}`;
  return target ? `Entreprise : ${target}` : null;
}
