import "server-only";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { DIRECT_MESSAGES } from "@/content/equipe";
import { NOTIFICATIONS } from "@/content/notifications";
import { db, schema } from "@/db";
import type { Application, WipeRequest } from "@/db/schema";
import type { FieldErrors } from "./application";
import { fieldErrors, parseStep } from "./application";
import { availabilityErrors, cleanDraft, getLatestApplication } from "./applications";
import { isDiscordId, sendDirectMessage } from "./discord";
import { logEvent } from "./events";
import { notify } from "./notifications";
import type { Reviewer, ReviewResult } from "./review";
import { discord } from "./review";
import { hasRank } from "./session";
import { SITE_URL } from "./site-url";

/*
 * Wipe de personnage. Après accord d'un admin sur un ticket Discord, le joueur whitelist (de lui-même, ou invité
 * par un admin depuis l'onglet Wipe) remplit un nouveau personnage : la partie RP et le background, jamais le HRP.
 * Un admin valide la demande, et le nouveau personnage remplace l'ancien dans la candidature whitelist.
 * Rien n'apparaît sur la fiche du joueur : seuls les admins et owners voient les wipes.
 */

/** Étapes du nouveau personnage, dans l'ordre. */
export const WIPE_STEPS = ["rp", "background"] as const;
export type WipeStep = (typeof WIPE_STEPS)[number];

export function isWipeStep(value: string): value is WipeStep {
  return (WIPE_STEPS as readonly string[]).includes(value);
}

const OPEN: WipeRequest["status"][] = ["ouverte", "envoyee"];

/** Demande en cours (en saisie ou envoyée), ou null. */
export const getOpenWipe = cache(async (userId: string): Promise<WipeRequest | null> => {
  const [row] = await db()
    .select()
    .from(schema.wipeRequests)
    .where(and(eq(schema.wipeRequests.userId, userId), inArray(schema.wipeRequests.status, OPEN)));
  return row ?? null;
});

/** Dernière demande décidée, pour montrer un refus au joueur. */
export async function getLatestDecidedWipe(userId: string) {
  const [row] = await db()
    .select()
    .from(schema.wipeRequests)
    .where(and(eq(schema.wipeRequests.userId, userId), inArray(schema.wipeRequests.status, ["acceptee", "refusee"])))
    .orderBy(desc(schema.wipeRequests.decidedAt))
    .limit(1);
  return row ?? null;
}

/** Seul un joueur whitelist (whitelist non retirée) a un personnage à wipe. */
export function canWipe(application: Application | null): application is Application {
  return application?.status === "whitelistee" && !application.whitelistRevokedAt;
}

export function isWipeStepComplete(wipe: Pick<WipeRequest, WipeStep>, step: WipeStep) {
  return parseStep(step, wipe[step]).success;
}

/** Le joueur commence sa demande (après accord sur son ticket Discord). */
export async function startWipe(userId: string): Promise<WipeRequest | { error: string }> {
  const open = await getOpenWipe(userId);
  if (open) return open;
  if (!canWipe(await getLatestApplication(userId))) return { error: "Seul un joueur whitelist peut demander un wipe." };
  const [created] = await db().insert(schema.wipeRequests).values({ userId }).onConflictDoNothing().returning();
  return created ?? (await getOpenWipe(userId)) ?? { error: "Impossible de commencer la demande." };
}

/** Un admin invite un joueur whitelist à refaire son personnage : notification et message privé avec le lien. */
export async function inviteWipe(playerId: string, admin: Reviewer): Promise<ReviewResult> {
  if (!hasRank(admin, "admin")) return { error: "Réservé aux admins." };
  if (!isDiscordId(playerId)) return { error: "Indique un ID Discord valide." };
  if (!canWipe(await getLatestApplication(playerId))) return { error: "Ce joueur n'est pas whitelist sur le portail." };
  if (await getOpenWipe(playerId)) return { error: "Ce joueur a déjà une demande de wipe en cours." };
  const [created] = await db().insert(schema.wipeRequests).values({ userId: playerId, invitedById: admin.id }).onConflictDoNothing().returning();
  if (!created) return { error: "Ce joueur a déjà une demande de wipe en cours." };
  await logEvent({ type: "wipe.invitation", subjectId: playerId, actorId: admin.id });
  await notify(playerId, NOTIFICATIONS.wipeInvitation());
  const warnings: string[] = [];
  await discord("Message privé", warnings, () => sendDirectMessage(playerId, { embeds: [DIRECT_MESSAGES.wipeInvitation({ url: `${SITE_URL}/portail/wipe` })] }));
  return { ok: true, warnings };
}

async function editableWipe(userId: string) {
  const wipe = await getOpenWipe(userId);
  return wipe?.status === "ouverte" ? wipe : null;
}

/** Enregistrement automatique d'une étape du nouveau personnage. */
export async function saveWipeDraft(userId: string, step: WipeStep, values: unknown): Promise<{ ok: true } | { error: string }> {
  const wipe = await editableWipe(userId);
  if (!wipe) return { error: "Aucune demande de wipe en cours." };
  const draft = cleanDraft(step, values);
  if (!draft) return { error: "Brouillon invalide." };
  await db()
    .update(schema.wipeRequests)
    .set({ [step]: draft })
    .where(and(eq(schema.wipeRequests.id, wipe.id), eq(schema.wipeRequests.status, "ouverte")));
  return { ok: true };
}

/** « Suivant » : l'étape est enregistrée, puis validée (places encore ouvertes pour l'affinité et la créature). */
export async function saveWipeStep(userId: string, step: WipeStep, values: unknown): Promise<{ errors: FieldErrors } | { ok: true }> {
  const saved = await saveWipeDraft(userId, step, values);
  if ("error" in saved) return { errors: { form: saved.error } };
  const draft = cleanDraft(step, values)!;
  const parsed = parseStep(step, draft);
  const errors = { ...(parsed.success ? {} : fieldErrors(parsed.error)), ...(await availabilityErrors(step, draft)) };
  return Object.keys(errors).length > 0 ? { errors } : { ok: true };
}

/** Envoi de la demande aux admins : les deux étapes doivent être complètes. */
export async function submitWipe(userId: string): Promise<{ ok: true } | { error: string }> {
  const wipe = await editableWipe(userId);
  if (!wipe) return { error: "Aucune demande de wipe à envoyer." };
  if (!WIPE_STEPS.every(step => isWipeStepComplete(wipe, step))) return { error: "Remplis ton nouveau personnage et son background avant d'envoyer." };
  const closed = await availabilityErrors("rp", wipe.rp ?? {});
  if (Object.keys(closed).length > 0) return { error: Object.values(closed)[0] };
  const [sent] = await db()
    .update(schema.wipeRequests)
    .set({ status: "envoyee", submittedAt: new Date() })
    .where(and(eq(schema.wipeRequests.id, wipe.id), eq(schema.wipeRequests.status, "ouverte")))
    .returning();
  if (!sent) return { error: "Ta demande est déjà envoyée." };
  await logEvent({ type: "wipe.envoyee", subjectId: userId });
  return { ok: true };
}

/** Le joueur abandonne sa demande (en saisie ou envoyée, tant qu'elle n'est pas décidée). */
export async function cancelWipe(userId: string) {
  await db()
    .delete(schema.wipeRequests)
    .where(and(eq(schema.wipeRequests.userId, userId), inArray(schema.wipeRequests.status, OPEN)));
}

/**
 * Décision d'un admin. Acceptée : le nouveau personnage remplace l'ancien dans la candidature whitelist,
 * sans autre relecture. Refusée : message obligatoire, l'ancien personnage reste.
 */
export async function decideWipe(wipeId: string, admin: Reviewer, accept: boolean, comment: string): Promise<ReviewResult> {
  if (!hasRank(admin, "admin")) return { error: "Réservé aux admins." };
  const message = comment.trim();
  if (!accept && !message) return { error: "Explique au joueur pourquoi le wipe est refusé." };
  if (message.length > 1000) return { error: "1000 caractères maximum." };
  const [wipe] = await db().select().from(schema.wipeRequests).where(eq(schema.wipeRequests.id, wipeId));
  if (!wipe || wipe.status !== "envoyee") return { error: "Cette demande a déjà été traitée : recharge la page." };
  if (wipe.userId === admin.id && !hasRank(admin, "owner")) return { error: "Tu ne peux pas valider ton propre wipe." };

  const application = await getLatestApplication(wipe.userId);
  if (accept && !canWipe(application)) return { error: "Ce joueur n'est plus whitelist : le wipe ne peut pas être appliqué." };

  const [decided] = await db()
    .update(schema.wipeRequests)
    .set({ status: accept ? "acceptee" : "refusee", reviewerId: admin.id, comment: message || null, decidedAt: new Date() })
    .where(and(eq(schema.wipeRequests.id, wipe.id), eq(schema.wipeRequests.status, "envoyee")))
    .returning();
  if (!decided) return { error: "Cette demande a déjà été traitée : recharge la page." };
  if (accept) await db().update(schema.applications).set({ rp: wipe.rp, background: wipe.background }).where(eq(schema.applications.id, application!.id));

  await logEvent({ type: accept ? "wipe.acceptee" : "wipe.refusee", subjectId: wipe.userId, actorId: admin.id, data: { commentaire: message } });
  await notify(wipe.userId, accept ? NOTIFICATIONS.wipeAcceptee() : NOTIFICATIONS.wipeRefusee());
  const warnings: string[] = [];
  await discord("Message privé", warnings, () =>
    sendDirectMessage(wipe.userId, { embeds: [accept ? DIRECT_MESSAGES.wipeAcceptee({ comment: message }) : DIRECT_MESSAGES.wipeRefusee({ comment: message })] }),
  );
  return { ok: true, warnings };
}

const player = { id: schema.users.id, username: schema.users.username, globalName: schema.users.globalName, avatar: schema.users.avatar };

/** Nombre de wipes validés par joueur (seulement le nombre, pas les anciens personnages). */
export async function acceptedWipeCounts(userIds?: string[]): Promise<Map<string, number>> {
  if (userIds?.length === 0) return new Map();
  const rows = await db()
    .select({ userId: schema.wipeRequests.userId, total: count() })
    .from(schema.wipeRequests)
    .where(and(eq(schema.wipeRequests.status, "acceptee"), userIds ? inArray(schema.wipeRequests.userId, userIds) : undefined))
    .groupBy(schema.wipeRequests.userId);
  return new Map(rows.map(row => [row.userId, row.total]));
}

/** « Aucun wipe », « 1 wipe », « 3 wipes ». */
export function wipeCountLabel(total: number) {
  return total === 0 ? "Aucun wipe" : `${total} wipe${total > 1 ? "s" : ""}`;
}

/** Onglet Wipe : demandes à valider, demandes en cours de saisie, et les dernières décisions. */
export async function wipeBoard() {
  const rows = await db()
    .select({ wipe: schema.wipeRequests, player })
    .from(schema.wipeRequests)
    .innerJoin(schema.users, eq(schema.users.id, schema.wipeRequests.userId))
    .orderBy(desc(schema.wipeRequests.createdAt))
    .limit(200);
  // Ancien personnage, pour comparer avec le nouveau.
  const current = new Map<string, Application["rp"]>();
  for (const { wipe } of rows.filter(row => row.wipe.status === "envoyee")) current.set(wipe.userId, (await getLatestApplication(wipe.userId))?.rp ?? null);
  const counts = await acceptedWipeCounts([...new Set(rows.map(row => row.wipe.userId))]);
  const withCount = <T extends { wipe: WipeRequest }>(row: T) => ({ ...row, wipes: counts.get(row.wipe.userId) ?? 0 });
  return {
    pending: rows.filter(row => row.wipe.status === "envoyee").map(row => ({ ...withCount(row), previous: current.get(row.wipe.userId) ?? null })),
    open: rows.filter(row => row.wipe.status === "ouverte").map(withCount),
    decided: rows.filter(row => row.wipe.status === "acceptee" || row.wipe.status === "refusee").slice(0, 20).map(withCount),
  };
}

/** Joueurs whitelist sans demande en cours, pour le sélecteur « Inviter un joueur ». */
export async function wipeCandidates() {
  const rows = await db()
    .selectDistinctOn([schema.applications.userId], { player, status: schema.applications.status, revokedAt: schema.applications.whitelistRevokedAt })
    .from(schema.applications)
    .innerJoin(schema.users, eq(schema.users.id, schema.applications.userId))
    .orderBy(schema.applications.userId, desc(schema.applications.createdAt));
  const open = new Set((await db().select({ userId: schema.wipeRequests.userId }).from(schema.wipeRequests).where(inArray(schema.wipeRequests.status, OPEN))).map(row => row.userId));
  return rows.filter(row => row.status === "whitelistee" && !row.revokedAt && !open.has(row.player.id)).map(row => row.player);
}
