import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { DIRECT_MESSAGES } from "@/content/equipe";
import { NOTIFICATIONS } from "@/content/notifications";
import { db, schema } from "@/db";
import type { Application, TakeoverDossier } from "@/db/schema";
import type { FieldErrors } from "./application";
import { dossierTargetLabel, fieldErrors, parseStep, wantsDossier } from "./application";
import { availabilityErrors, cleanDraft, getLatestApplication } from "./applications";
import { takeoverNames } from "./businesses";
import { sendDirectMessage } from "./discord";
import { logEvent } from "./events";
import { notify } from "./notifications";
import type { Reviewer, ReviewResult } from "./review";
import { discord } from "./review";
import { hasRank } from "./session";

/*
 * Dossier de reprise déposé à part : pour un joueur dont la candidature est partie sans dossier
 * (ou déjà whitelist), relu ensuite par l'équipe, qui l'accepte ou le refuse.
 */

const OPEN: TakeoverDossier["status"][] = ["brouillon", "envoye"];

/** Dossier en cours (brouillon ou envoyé), ou null. */
export const getOpenDossier = cache(async (userId: string): Promise<TakeoverDossier | null> => {
  const [row] = await db()
    .select()
    .from(schema.takeoverDossiers)
    .where(and(eq(schema.takeoverDossiers.userId, userId), inArray(schema.takeoverDossiers.status, OPEN)));
  return row ?? null;
});

/** Dossiers séparés du joueur, du plus récent au plus ancien (fiche équipe, page du joueur). */
export async function listDossiers(userId: string) {
  return db().select().from(schema.takeoverDossiers).where(eq(schema.takeoverDossiers.userId, userId)).orderBy(desc(schema.takeoverDossiers.createdAt));
}

/**
 * Peut déposer un dossier à part : candidature envoyée (ou en entretien) sans dossier, ou joueur whitelist.
 * Jamais pendant qu'il remplit encore sa candidature : le dossier se dépose alors dans la candidature.
 */
export function canFileStandalone(application: Application | null) {
  if (!application) return false;
  if (application.status === "whitelistee") return !application.whitelistRevokedAt;
  return (application.status === "envoyee" || application.status === "entretien") && !wantsDossier(application);
}

/** Enregistrement automatique pendant la saisie ; le brouillon est créé au premier enregistrement. */
export async function saveDossierDraft(userId: string, values: unknown): Promise<{ ok: true } | { error: string }> {
  const application = await getLatestApplication(userId);
  if (!canFileStandalone(application)) return { error: "Tu ne peux pas déposer de dossier pour le moment." };
  const content = cleanDraft("dossier", values);
  if (!content) return { error: "Brouillon invalide." };
  const open = await getOpenDossier(userId);
  if (open?.status === "envoye") return { error: "Ton dossier est déjà envoyé." };
  if (open) await db().update(schema.takeoverDossiers).set({ content }).where(and(eq(schema.takeoverDossiers.id, open.id), eq(schema.takeoverDossiers.status, "brouillon")));
  else await db().insert(schema.takeoverDossiers).values({ userId, applicationId: application!.id, content }).onConflictDoNothing();
  return { ok: true };
}

/** Envoi : dossier complet et cible encore disponible, puis l'équipe est prévenue par la liste « Dossiers ». */
export async function submitDossier(userId: string, values: unknown): Promise<{ errors: FieldErrors } | { ok: true }> {
  const saved = await saveDossierDraft(userId, values);
  if ("error" in saved) return { errors: { form: saved.error } };
  const content = cleanDraft("dossier", values)!;
  const parsed = parseStep("dossier", content);
  const errors = { ...(parsed.success ? {} : fieldErrors(parsed.error)), ...(await availabilityErrors("dossier", content)) };
  if (Object.keys(errors).length > 0) return { errors };

  const [sent] = await db()
    .update(schema.takeoverDossiers)
    .set({ status: "envoye", submittedAt: new Date() })
    .where(and(eq(schema.takeoverDossiers.userId, userId), eq(schema.takeoverDossiers.status, "brouillon")))
    .returning();
  if (!sent) return { errors: { form: "Ton dossier est déjà envoyé." } };
  await logEvent({ type: "dossier.envoye", subjectId: userId, data: { cible: dossierTargetLabel(content, await takeoverNames()) } });
  return { ok: true };
}

/** Décision de l'équipe (recruteur ou plus) sur un dossier envoyé. Le message est obligatoire en cas de refus. */
export async function decideDossier(dossierId: string, reviewer: Reviewer, accept: boolean, comment: string): Promise<ReviewResult> {
  if (!hasRank(reviewer, "recruteur")) return { error: "Réservé à l'équipe." };
  const message = comment.trim();
  if (!accept && message.length === 0) return { error: "Explique au joueur pourquoi son dossier est refusé." };
  if (message.length > 1000) return { error: "1000 caractères maximum." };
  const [dossier] = await db().select().from(schema.takeoverDossiers).where(eq(schema.takeoverDossiers.id, dossierId));
  if (!dossier) return { error: "Dossier introuvable : recharge la page." };
  if (dossier.userId === reviewer.id && !hasRank(reviewer, "owner")) return { error: "Tu ne peux pas décider de ton propre dossier." };

  const [updated] = await db()
    .update(schema.takeoverDossiers)
    .set({ status: accept ? "accepte" : "refuse", reviewerId: reviewer.id, comment: message || null, decidedAt: new Date() })
    .where(and(eq(schema.takeoverDossiers.id, dossierId), eq(schema.takeoverDossiers.status, "envoye")))
    .returning();
  if (!updated) return { error: "Ce dossier a déjà été traité : recharge la page." };

  const target = dossierTargetLabel(dossier.content, await takeoverNames()) ?? "ta reprise";
  await logEvent({ type: accept ? "dossier.accepte" : "dossier.refuse", subjectId: dossier.userId, actorId: reviewer.id, data: { cible: target, commentaire: message } });
  await notify(dossier.userId, accept ? NOTIFICATIONS.dossierAccepte(target) : NOTIFICATIONS.dossierRefuse(target));
  const warnings: string[] = [];
  await discord("Message privé", warnings, () =>
    sendDirectMessage(dossier.userId, { embeds: [accept ? DIRECT_MESSAGES.dossierAccepte({ target, comment: message }) : DIRECT_MESSAGES.dossierRefuse({ target, comment: message })] }),
  );
  return { ok: true, warnings };
}

/** Dossiers en attente de lecture, pour la page « Dossiers de reprise » de l'équipe. */
export async function pendingDossiers() {
  return db()
    .select({ dossier: schema.takeoverDossiers, user: { id: schema.users.id, username: schema.users.username, globalName: schema.users.globalName, avatar: schema.users.avatar } })
    .from(schema.takeoverDossiers)
    .innerJoin(schema.users, eq(schema.users.id, schema.takeoverDossiers.userId))
    .where(eq(schema.takeoverDossiers.status, "envoye"))
    .orderBy(schema.takeoverDossiers.submittedAt);
}
