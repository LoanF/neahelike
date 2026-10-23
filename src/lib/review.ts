import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { NOTIFICATIONS } from "@/content/notifications";
import { DIRECT_MESSAGES } from "@/content/equipe";
import { displayName } from "@/lib/discord-cdn";
import { db, schema } from "@/db";
import type { Application, ApplicationStatus, NoteVisibility, User } from "@/db/schema";
import { formatDate } from "@/components/portal/application-status";
import type { DataStepId } from "./application";
import { DATA_STEPS, STEPS, visibleSteps } from "./application";
import { getLatestApplication, getOpenApplication, reapplyDate } from "./applications";
import { criteriaLabels, getCriteria, OTHER_CRITERION } from "./criteria";
import { addRole, banMember, removeRole, sendDirectMessage, unbanMember } from "./discord";
import { env } from "./env";
import { logEvent } from "./events";
import { syncMember } from "./members";
import { notify } from "./notifications";
import { ownerIds } from "./permissions";
import { hasRank } from "./session";
import { SITE_URL } from "./site-url";
import type { WlSlot } from "./wl-session";
import { formatWlSlot } from "./wl-session";

export type Reviewer = Pick<User, "id" | "rank" | "username" | "globalName">;

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

/**
 * Sanctions et suppression de compte : sur soi-même seulement pour un owner, jamais sur un autre owner, et sur un rang
 * strictement inférieur (un admin ne peut pas agir sur un autre admin). Les owners sont relus dans la
 * liste des owners, pas dans `users.rank` qui peut dater de quelques minutes.
 */
export async function canActOn(subjectId: string, reviewer: Pick<User, "id" | "rank">, { fresh = false, known }: { fresh?: boolean; known?: Pick<User, "rank"> } = {}): Promise<string | null> {
  // Un owner peut tout faire sur son propre compte ; les autres membres de l'équipe, rien.
  if (subjectId === reviewer.id) return hasRank(reviewer, "owner") ? null : "Tu ne peux pas faire ça sur ton propre compte.";
  if ((await ownerIds()).includes(subjectId)) return "Impossible sur un owner.";
  // `known` : rang déjà lu par l'appelant (affichage de la fiche), pour éviter de relire la table.
  const target = known ?? (await db().select({ rank: schema.users.rank }).from(schema.users).where(eq(schema.users.id, subjectId)))[0];
  if (!target) return null;
  // Pour l'action elle-même, le rang de la cible est relu sur Discord : celui en base date de sa dernière visite.
  let rank = target.rank;
  if (fresh) {
    try {
      ({ rank } = await syncMember(subjectId));
    } catch {
      return "Discord ne répond pas : impossible de vérifier le rang de ce membre, réessaie dans un instant.";
    }
  }
  if (hasRank({ rank }, reviewer.rank)) return "Impossible sur un membre de l'équipe de rang égal ou supérieur au tien.";
  return null;
}

/** Garde commune des actions lourdes (effacement, suppression, retrait, blacklist, levée) : admin, puis `canActOn`. */
async function sanctionGuard(subjectId: string, reviewer: Reviewer): Promise<string | null> {
  if (!hasRank(reviewer, "admin")) return "Réservé aux admins.";
  return canActOn(subjectId, reviewer, { fresh: true });
}

/** Retour au rôle de base sur Discord : plus de whitelist ni d'« attente de wl », rôle Novice rendu. */
async function resetToBaseRole(subjectId: string, why: string, warnings: string[]) {
  const { DISCORD_ROLE_ATTENTE_WL: waiting, DISCORD_ROLE_WL: whitelisted, DISCORD_ROLE_NON_WL: novice } = env();
  if (whitelisted) await discord("Retrait du rôle « Magistrat (wl) »", warnings, () => removeRole(subjectId, whitelisted, why));
  if (waiting) await discord("Retrait du rôle « attente de wl »", warnings, () => removeRole(subjectId, waiting, why));
  if (novice) await discord("Rôle « Novice »", warnings, () => addRole(subjectId, novice, why));
  else warnings.push("Rôle de base non configuré (DISCORD_ROLE_NON_WL).");
}

/** Les effets Discord ne bloquent jamais une décision : un échec devient un avertissement pour l'équipe. */
export async function discord(label: string, warnings: string[], task: () => Promise<unknown>) {
  try {
    const result = await task();
    if (result === false) warnings.push(`${label} : MP fermés, le joueur verra la décision sur le portail.`);
  } catch (error) {
    console.error(label, error);
    warnings.push(`${label} : échec côté Discord.`);
  }
}

function reason(reviewer: Reviewer, action: string) {
  return `${action} par ${displayName(reviewer)} (portail)`;
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
/** Validation écrite : rôle « attente de wl » et créneau de la prochaine session de whitelist, envoyé au joueur. */
export async function validateWritten(application: Application, reviewer: Reviewer, slot: WlSlot): Promise<ReviewResult> {
  const from: ApplicationStatus[] = hasRank(reviewer, "admin") ? OPEN_FOR_ADMIN : ["envoyee"];
  if (!from.includes(application.status)) return { error: "Seul un admin peut valider une candidature qui n'a pas été envoyée." };

  const updated = await transition(application, from, {
    status: "entretien",
    reviewerId: reviewer.id,
    changesSteps: null,
    changesComment: null,
    interviewSlotStart: slot.start,
    interviewSlotEnd: slot.end,
  });
  if (!updated) return CHANGED;
  const session = formatWlSlot(slot);
  await logEvent({ type: "candidature.validee", subjectId: application.userId, actorId: reviewer.id, data: { avant: application.status, session } });
  await notify(application.userId, NOTIFICATIONS.validee(session));

  const warnings: string[] = [];
  const role = env().DISCORD_ROLE_ATTENTE_WL;
  if (role) await discord("Rôle « attente de wl »", warnings, () => addRole(application.userId, role, reason(reviewer, "Candidature validée")));
  else warnings.push("Rôle « attente de wl » non configuré (DISCORD_ROLE_ATTENTE_WL).");
  await discord("Message privé", warnings, () => sendDirectMessage(application.userId, { embeds: [DIRECT_MESSAGES.validee(session)] }));
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
  if (chosen.includes(OTHER_CRITERION) && !comment.trim()) return { error: "Précise le critère « Autre » dans le commentaire." };

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

/**
 * Admin : efface la candidature (le joueur peut recommencer tout de suite, sans délai). Les rôles qu'elle avait
 * donnés partent avec elle : « attente de wl » pendant l'entretien, la whitelist si elle était validée.
 */
export async function wipeApplication(application: Application, reviewer: Reviewer): Promise<ReviewResult> {
  const refused = await sanctionGuard(application.userId, reviewer);
  if (refused) return { error: refused };
  await db().delete(schema.applications).where(eq(schema.applications.id, application.id));
  await logEvent({ type: "candidature.supprimee", subjectId: application.userId, actorId: reviewer.id, data: { statut: application.status } });
  await notify(application.userId, NOTIFICATIONS.supprimee());

  const warnings: string[] = [];
  const { DISCORD_ROLE_ATTENTE_WL: waiting, DISCORD_ROLE_WL: whitelisted, DISCORD_ROLE_NON_WL: novice } = env();
  const why = reason(reviewer, "Candidature effacée");
  if (waiting && application.status === "entretien") {
    await discord("Retrait du rôle « attente de wl »", warnings, () => removeRole(application.userId, waiting, why));
  }
  if (application.status === "whitelistee" && !application.whitelistRevokedAt) {
    if (whitelisted) await discord("Retrait du rôle « Magistrat (wl) »", warnings, () => removeRole(application.userId, whitelisted, why));
    if (novice) await discord("Rôle « Novice »", warnings, () => addRole(application.userId, novice, why));
  }
  return { ok: true, warnings };
}

/** Refus : l'admin lève le délai de 3 mois, le joueur peut recandidater tout de suite (le refus reste dans l'historique). */
export async function liftReapplyDelay(application: Application, reviewer: Reviewer): Promise<ReviewResult> {
  if (!hasRank(reviewer, "admin")) return { error: "Réservé aux admins." };
  if (application.status !== "refusee") return { error: "Seule une candidature refusée a un délai." };
  if (application.reapplyLiftedAt) return { error: "Le délai est déjà levé." };
  const updated = await transition(application, ["refusee"], { reapplyLiftedAt: new Date() });
  if (!updated) return CHANGED;
  // Délai gardé après une ancienne suppression de compte : levé lui aussi.
  await db().delete(schema.reapplyLocks).where(eq(schema.reapplyLocks.discordId, application.userId));
  await logEvent({ type: "candidature.delai_leve", subjectId: application.userId, actorId: reviewer.id });
  await notify(application.userId, NOTIFICATIONS.delaiLeve());
  const warnings: string[] = [];
  await discord("Message privé", warnings, () => sendDirectMessage(application.userId, { embeds: [DIRECT_MESSAGES.delaiLeve({ url: `${SITE_URL}/portail` })] }));
  return { ok: true, warnings };
}

/** Refus annulé par un admin : la candidature revient « à traiter », comme si elle venait d'être envoyée. */
export async function reopenRefused(application: Application, reviewer: Reviewer): Promise<ReviewResult> {
  if (!hasRank(reviewer, "admin")) return { error: "Réservé aux admins." };
  if (application.status !== "refusee") return { error: "Seule une candidature refusée peut être rouverte." };
  if (await getOpenApplication(application.userId)) return { error: "Ce joueur a déjà commencé une nouvelle candidature : efface-la d'abord." };
  const updated = await transition(application, ["refusee"], {
    status: "envoyee",
    reviewerId: reviewer.id,
    refusalCriteria: null,
    refusalComment: null,
    decidedAt: null,
    reapplyLiftedAt: null,
    viewedAt: null,
  });
  if (!updated) return CHANGED;
  await logEvent({ type: "candidature.rouverte", subjectId: application.userId, actorId: reviewer.id });
  await notify(application.userId, NOTIFICATIONS.rouverte());
  const warnings: string[] = [];
  await discord("Message privé", warnings, () => sendDirectMessage(application.userId, { embeds: [DIRECT_MESSAGES.rouverte()] }));
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
  const refused = await sanctionGuard(subjectId, reviewer);
  if (refused) return { error: refused };
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
  await resetToBaseRole(subjectId, reason(reviewer, "Compte du portail supprimé"), warnings);
  await discord("Message privé", warnings, () => sendDirectMessage(subjectId, { embeds: [DIRECT_MESSAGES.compteSupprime({ url: `${SITE_URL}/connexion` })] }));

  await db().delete(schema.users).where(eq(schema.users.id, subjectId));
  await logEvent({ type: "compte.supprime", subjectId: null, actorId: reviewer.id, data: keepDelay ? { delaiConserve: true } : {} });
  return { ok: true, warnings };
}

const REASON_MAX_LENGTH = 500;

function cleanReason(value: string) {
  const text = value.trim().slice(0, REASON_MAX_LENGTH);
  return text || null;
}

/**
 * Admin : retire la whitelist d'un joueur. La candidature reste dans l'historique mais ne bloque plus :
 * le joueur peut en recommencer une de zéro tout de suite. Sur Discord, il repasse au rôle de base.
 */
export async function revokeWhitelist(subjectId: string, reviewer: Reviewer, reasonText: string): Promise<ReviewResult> {
  const refused = await sanctionGuard(subjectId, reviewer);
  if (refused) return { error: refused };
  const latest = await getLatestApplication(subjectId);
  if (!latest || latest.status !== "whitelistee" || latest.whitelistRevokedAt) return { error: "Ce joueur n'est pas whitelist : recharge la fiche." };

  const revokeReason = cleanReason(reasonText);
  const [updated] = await db()
    .update(schema.applications)
    .set({ whitelistRevokedAt: new Date(), whitelistRevokedById: reviewer.id, whitelistRevokeReason: revokeReason })
    .where(and(eq(schema.applications.id, latest.id), eq(schema.applications.status, "whitelistee"), isNull(schema.applications.whitelistRevokedAt)))
    .returning();
  if (!updated) return CHANGED;
  await logEvent({ type: "whitelist.retiree", subjectId, actorId: reviewer.id, data: revokeReason ? { raison: revokeReason } : {} });
  await notify(subjectId, NOTIFICATIONS.whitelistRetiree(revokeReason));

  const warnings: string[] = [];
  await resetToBaseRole(subjectId, reason(reviewer, "Whitelist retirée"), warnings);
  await discord("Message privé", warnings, () =>
    sendDirectMessage(subjectId, { embeds: [DIRECT_MESSAGES.whitelistRetiree({ reason: revokeReason, url: `${SITE_URL}/portail` })] }),
  );
  return { ok: true, warnings };
}

/**
 * Admin : blacklist. Le joueur n'a plus accès au portail (page de blocage) et il est banni du Discord.
 * Sa whitelist éventuelle est retirée : si la blacklist est levée un jour, il devra recandidater.
 */
export async function blacklistPlayer(subjectId: string, reviewer: Reviewer, reasonText: string): Promise<ReviewResult> {
  const refused = await sanctionGuard(subjectId, reviewer);
  if (refused) return { error: refused };
  const [player] = await db().select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, subjectId));
  if (!player) return { error: "Ce compte n'existe plus." };

  const blacklistReason = cleanReason(reasonText);
  const [created] = await db()
    .insert(schema.blacklist)
    .values({ discordId: subjectId, reason: blacklistReason, createdById: reviewer.id, source: "site" })
    .onConflictDoNothing()
    .returning();
  if (!created) return { error: "Ce joueur est déjà blacklisté." };

  const latest = await getLatestApplication(subjectId);
  if (latest?.status === "whitelistee" && !latest.whitelistRevokedAt) {
    await db()
      .update(schema.applications)
      .set({ whitelistRevokedAt: new Date(), whitelistRevokedById: reviewer.id, whitelistRevokeReason: "Blacklist" })
      .where(eq(schema.applications.id, latest.id));
  }
  await logEvent({ type: "compte.blacklist", subjectId, actorId: reviewer.id, data: blacklistReason ? { raison: blacklistReason } : {} });

  // Le MP part avant le bannissement : après, le bot ne partage plus de serveur avec lui.
  const warnings: string[] = [];
  await discord("Message privé", warnings, () => sendDirectMessage(subjectId, { embeds: [DIRECT_MESSAGES.blacklist({ reason: blacklistReason })] }));
  await discord("Bannissement du Discord", warnings, () => banMember(subjectId, reason(reviewer, `Blacklist${blacklistReason ? ` : ${blacklistReason}` : ""}`).slice(0, 500)));
  await db().update(schema.users).set({ inGuild: false }).where(eq(schema.users.id, subjectId));
  return { ok: true, warnings };
}

/** Admin : lève la blacklist et le bannissement Discord. Le joueur devra rejoindre le serveur et, s'il n'est plus whitelist, recandidater. */
export async function liftBlacklist(subjectId: string, reviewer: Reviewer): Promise<ReviewResult> {
  const refused = await sanctionGuard(subjectId, reviewer);
  if (refused) return { error: refused };
  const [removed] = await db().delete(schema.blacklist).where(eq(schema.blacklist.discordId, subjectId)).returning();
  if (!removed) return { error: "Ce joueur n'est pas blacklisté : recharge la fiche." };
  await logEvent({ type: "compte.blacklist_levee", subjectId, actorId: reviewer.id });

  const warnings: string[] = [];
  await discord("Levée du bannissement Discord", warnings, () => unbanMember(subjectId, reason(reviewer, "Blacklist levée")));
  return { ok: true, warnings };
}
