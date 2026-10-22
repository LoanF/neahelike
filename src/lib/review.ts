import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { NOTIFICATIONS } from "@/content/notifications";
import { DIRECT_MESSAGES } from "@/content/equipe";
import { db, schema } from "@/db";
import type { Application, ApplicationStatus, NoteVisibility, User } from "@/db/schema";
import { formatDate } from "@/components/portal/application-status";
import type { DataStepId } from "./application";
import { DATA_STEPS, STEPS, visibleSteps } from "./application";
import { getLatestApplication, reapplyDate } from "./applications";
import { criteriaLabels, getCriteria, OTHER_CRITERION } from "./criteria";
import { addRole, removeRole, sendDirectMessage } from "./discord";
import { env } from "./env";
import { logEvent } from "./events";
import { notify } from "./notifications";
import { hasRank } from "./session";
import { SITE_URL } from "./site-url";

type Reviewer = Pick<User, "id" | "rank" | "username" | "globalName">;

export type ReviewResult = { ok: true; warnings: string[] } | { error: string };

const OPEN_FOR_ADMIN: ApplicationStatus[] = ["brouillon", "envoyee", "a_modifier"];

/**
 * Passe la candidature d'un statut à l'autre, seulement si elle n'a pas changé entre-temps
 * (deux membres de l'équipe sur la même fiche).
 */
async function transition(application: Application, from: ApplicationStatus[], values: Partial<typeof schema.applications.$inferInsert>) {
  const [updated] = await db()
    .update(schema.applications)
    .set(values)
    .where(and(eq(schema.applications.id, application.id), inArray(schema.applications.status, from)))
    .returning();
  return updated ?? null;
}

const CHANGED = { error: "La candidature a changé entre-temps : recharge la fiche." };

/** Les effets Discord ne bloquent jamais une décision : un échec devient un avertissement pour l'équipe. */
async function discord(label: string, warnings: string[], task: () => Promise<unknown>) {
  try {
    const result = await task();
    if (result === false) warnings.push(`${label} : MP fermés, le joueur verra la décision sur le portail.`);
  } catch (error) {
    console.error(label, error);
    warnings.push(`${label} : échec côté Discord.`);
  }
}

function reason(reviewer: Reviewer, action: string) {
  return `${action} par ${reviewer.globalName ?? reviewer.username} (portail)`;
}

/** Première ouverture de la fiche depuis l'envoi : badge « Vue ». */
export async function markViewed(application: Application, viewer: Reviewer) {
  if (application.status !== "envoyee" || application.viewedAt) return;
  const [updated] = await db()
    .update(schema.applications)
    .set({ viewedAt: new Date() })
    .where(and(eq(schema.applications.id, application.id), isNull(schema.applications.viewedAt)))
    .returning({ id: schema.applications.id });
  if (updated) await logEvent({ type: "candidature.vue", subjectId: application.userId, actorId: viewer.id });
}

/** Candidature écrite validée : rôle « attente de wl » et MP. Un admin peut valider à tout moment, le recruteur seulement une candidature envoyée. */
export async function validateWritten(application: Application, reviewer: Reviewer): Promise<ReviewResult> {
  const from: ApplicationStatus[] = hasRank(reviewer, "admin") ? OPEN_FOR_ADMIN : ["envoyee"];
  if (!from.includes(application.status)) return { error: "Seul un admin peut valider une candidature qui n'a pas été envoyée." };

  const updated = await transition(application, from, { status: "entretien", reviewerId: reviewer.id, changesSteps: null, changesComment: null });
  if (!updated) return CHANGED;
  await logEvent({ type: "candidature.validee", subjectId: application.userId, actorId: reviewer.id, data: { avant: application.status } });
  await notify(application.userId, NOTIFICATIONS.validee());

  const warnings: string[] = [];
  const role = env().DISCORD_ROLE_ATTENTE_WL;
  if (role) await discord("Rôle « attente de wl »", warnings, () => addRole(application.userId, role, reason(reviewer, "Candidature validée")));
  else warnings.push("Rôle « attente de wl » non configuré (DISCORD_ROLE_ATTENTE_WL).");
  await discord("Message privé", warnings, () => sendDirectMessage(application.userId, { embeds: [DIRECT_MESSAGES.validee()] }));
  return { ok: true, warnings };
}

export async function requestChanges(application: Application, reviewer: Reviewer, steps: string[], comment: string): Promise<ReviewResult> {
  const allowed = visibleSteps(application).map(step => step.id);
  const chosen = DATA_STEPS.filter(step => steps.includes(step) && allowed.includes(step)) as DataStepId[];
  if (chosen.length === 0) return { error: "Choisis au moins une partie à modifier." };
  if (comment.trim().length < 5) return { error: "Explique au joueur ce qu'il doit modifier." };

  const updated = await transition(application, ["envoyee"], {
    status: "a_modifier",
    reviewerId: reviewer.id,
    changesSteps: chosen,
    changesComment: comment.trim(),
  });
  if (!updated) return CHANGED;
  await logEvent({ type: "candidature.modification", subjectId: application.userId, actorId: reviewer.id, data: { etapes: chosen, commentaire: comment.trim() } });

  const warnings: string[] = [];
  const labels = STEPS.filter(step => chosen.includes(step.id as DataStepId)).map(step => step.label);
  await notify(application.userId, NOTIFICATIONS.modification(labels));
  await discord("Message privé", warnings, () =>
    sendDirectMessage(application.userId, { embeds: [DIRECT_MESSAGES.modification({ steps: labels, comment: comment.trim(), url: `${SITE_URL}/portail/candidature` })] }),
  );
  return { ok: true, warnings };
}

export async function refuse(application: Application, reviewer: Reviewer, criteria: string[], comment: string): Promise<ReviewResult> {
  const known = (await getCriteria()).map(item => item.id);
  const chosen = criteria.filter(id => known.includes(id));
  if (chosen.length === 0) return { error: "Coche au moins un critère de refus." };
  if (chosen.includes(OTHER_CRITERION) && comment.trim().length < 5) return { error: "Précise le critère « Autre » dans le commentaire." };

  const from: ApplicationStatus[] = hasRank(reviewer, "admin") ? [...OPEN_FOR_ADMIN, "entretien"] : ["envoyee", "entretien"];
  if (!from.includes(application.status)) return { error: "Cette candidature ne peut pas être refusée dans son état actuel." };

  const decidedAt = new Date();
  const updated = await transition(application, from, {
    status: "refusee",
    reviewerId: reviewer.id,
    refusalCriteria: chosen,
    refusalComment: comment.trim() || null,
    decidedAt,
  });
  if (!updated) return CHANGED;
  await logEvent({ type: "candidature.refusee", subjectId: application.userId, actorId: reviewer.id, data: { criteres: chosen, commentaire: comment.trim(), avant: application.status } });

  const warnings: string[] = [];
  const role = env().DISCORD_ROLE_ATTENTE_WL;
  if (role && application.status === "entretien") {
    await discord("Retrait du rôle « attente de wl »", warnings, () => removeRole(application.userId, role, reason(reviewer, "Candidature refusée")));
  }
  const until = formatDate(reapplyDate({ decidedAt })!);
  const labels = await criteriaLabels();
  await notify(application.userId, NOTIFICATIONS.refusee(until));
  await discord("Message privé", warnings, () =>
    sendDirectMessage(application.userId, { embeds: [DIRECT_MESSAGES.refusee({ criteria: chosen.map(id => labels[id] ?? id), comment: comment.trim(), until })] }),
  );
  return { ok: true, warnings };
}

/** Entretien vocal réussi : rôle « Magistrat (wl) » à la place de « attente de wl ». */
export async function validateInterview(application: Application, reviewer: Reviewer): Promise<ReviewResult> {
  const updated = await transition(application, ["entretien"], { status: "whitelistee", reviewerId: reviewer.id, decidedAt: new Date() });
  if (!updated) return CHANGED;
  await logEvent({ type: "entretien.valide", subjectId: application.userId, actorId: reviewer.id });
  await notify(application.userId, NOTIFICATIONS.whitelistee());

  const warnings: string[] = [];
  const { DISCORD_ROLE_ATTENTE_WL: waiting, DISCORD_ROLE_WL: whitelisted } = env();
  if (whitelisted) await discord("Rôle « Magistrat (wl) »", warnings, () => addRole(application.userId, whitelisted, reason(reviewer, "Whitelist validée")));
  else warnings.push("Rôle whitelist non configuré (DISCORD_ROLE_WL).");
  if (waiting) await discord("Retrait du rôle « attente de wl »", warnings, () => removeRole(application.userId, waiting, reason(reviewer, "Whitelist validée")));
  await discord("Message privé", warnings, () => sendDirectMessage(application.userId, { embeds: [DIRECT_MESSAGES.whitelistee()] }));
  return { ok: true, warnings };
}

/** Admin : efface la candidature (le joueur peut recommencer tout de suite, sans délai). */
export async function wipeApplication(application: Application, reviewer: Reviewer): Promise<ReviewResult> {
  if (!hasRank(reviewer, "admin")) return { error: "Réservé aux admins." };
  await db().delete(schema.applications).where(eq(schema.applications.id, application.id));
  await logEvent({ type: "candidature.supprimee", subjectId: application.userId, actorId: reviewer.id, data: { statut: application.status } });
  await notify(application.userId, NOTIFICATIONS.supprimee());

  const warnings: string[] = [];
  const role = env().DISCORD_ROLE_ATTENTE_WL;
  if (role && application.status === "entretien") {
    await discord("Retrait du rôle « attente de wl »", warnings, () => removeRole(application.userId, role, reason(reviewer, "Candidature effacée")));
  }
  return { ok: true, warnings };
}

export const NOTE_MAX_LENGTH = 2000;

/** Le recruteur écrit toujours pour toute l'équipe ; un admin choisit la visibilité. */
export async function addNote(subjectId: string, author: Reviewer, content: string, visibility: NoteVisibility) {
  const text = content.trim();
  if (!text) return { error: "La note est vide." };
  if (text.length > NOTE_MAX_LENGTH) return { error: `${NOTE_MAX_LENGTH} caractères maximum.` };
  const finalVisibility: NoteVisibility = hasRank(author, "admin") ? visibility : "equipe";
  await db().insert(schema.teamNotes).values({ subjectId, authorId: author.id, content: text, visibility: finalVisibility });
  await logEvent({ type: "note.ajoutee", subjectId, actorId: author.id, data: { visibilite: finalVisibility } });
  return { ok: true as const };
}

export async function deleteNote(noteId: string, viewer: Reviewer) {
  const [note] = await db().select().from(schema.teamNotes).where(eq(schema.teamNotes.id, noteId));
  if (!note) return { error: "Note introuvable." };
  // Un recruteur ne peut ni voir ni supprimer une note réservée aux admins, et seulement ses propres notes.
  const allowed = hasRank(viewer, "admin") || (note.authorId === viewer.id && note.visibility === "equipe");
  if (!allowed) return { error: "Tu ne peux pas supprimer cette note." };
  await db().delete(schema.teamNotes).where(eq(schema.teamNotes.id, noteId));
  return { ok: true as const, subjectId: note.subjectId };
}

/**
 * Admin : suppression d'un compte à la demande du joueur (ticket Discord).
 * Tout part avec le compte, sauf, après un refus de moins de 3 mois, l'ID Discord et la fin du délai.
 * Sur Discord, le joueur perd ses rôles de whitelist et retrouve le rôle de base.
 */
export async function deletePlayerAccount(subjectId: string, reviewer: Reviewer): Promise<ReviewResult> {
  if (!hasRank(reviewer, "admin")) return { error: "Réservé aux admins." };
  if (subjectId === reviewer.id) return { error: "Tu ne peux pas supprimer ton propre compte d'ici." };
  const [player] = await db().select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, subjectId));
  if (!player) return { error: "Ce compte n'existe plus." };

  const warnings: string[] = [];
  const latest = await getLatestApplication(subjectId);
  const until = latest?.status === "refusee" ? reapplyDate(latest) : null;
  const keepDelay = !!until && until > new Date();
  if (keepDelay) {
    await db()
      .insert(schema.reapplyLocks)
      .values({ discordId: subjectId, until: until! })
      .onConflictDoUpdate({ target: schema.reapplyLocks.discordId, set: { until: until! } });
  }

  // Plus de compte, plus de whitelist : retour au rôle de base, comme un nouvel arrivant.
  const { DISCORD_ROLE_ATTENTE_WL: waiting, DISCORD_ROLE_WL: whitelisted, DISCORD_ROLE_NON_WL: novice } = env();
  const why = reason(reviewer, "Compte du portail supprimé");
  if (waiting) await discord("Retrait du rôle « attente de wl »", warnings, () => removeRole(subjectId, waiting, why));
  if (whitelisted) await discord("Retrait du rôle « Magistrat (wl) »", warnings, () => removeRole(subjectId, whitelisted, why));
  if (novice) await discord("Rôle « Novice »", warnings, () => addRole(subjectId, novice, why));
  else warnings.push("Rôle de base non configuré (DISCORD_ROLE_NON_WL).");
  await discord("Message privé", warnings, () => sendDirectMessage(subjectId, { embeds: [DIRECT_MESSAGES.compteSupprime({ url: `${SITE_URL}/connexion` })] }));

  await db().delete(schema.users).where(eq(schema.users.id, subjectId));
  await logEvent({ type: "compte.supprime", subjectId: null, actorId: reviewer.id, data: keepDelay ? { delaiConserve: true } : {} });
  return { ok: true, warnings };
}
