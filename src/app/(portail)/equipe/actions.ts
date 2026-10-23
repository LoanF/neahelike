"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import type { NoteVisibility } from "@/db/schema";
import { getBlacklistEntry } from "@/lib/blacklist";
import { isDiscordId } from "@/lib/discord";
import type { ReviewResult } from "@/lib/review";
import { addNote, blacklistPlayer, deleteNote, deletePlayerAccount, liftBlacklist, refuse, requestChanges, revokeWhitelist, validateInterview, validateWritten, wipeApplication } from "@/lib/review";
import { RATE_LIMIT_MESSAGE, rateLimit } from "@/lib/rate-limit";
import { freshActor, requireUser } from "@/lib/session";
import type { Viewer } from "@/lib/team";
import { leavePresence, presenceFor, touchPresence } from "@/lib/team";

export async function heartbeat(subjectId: string): Promise<Viewer[]> {
  const user = await requireUser({ rank: "recruteur" });
  if (!isDiscordId(subjectId) || !(await rateLimit("presence", user.id))) return [];
  try {
    await touchPresence(subjectId, user.id);
  } catch {
    // Fiche supprimée entre-temps (clé étrangère) : plus de présence à signaler.
    return [];
  }
  return (await presenceFor([subjectId], user.id))[subjectId] ?? [];
}

export async function leaveProfile(subjectId: string) {
  const user = await requireUser({ rank: "recruteur" });
  if (!isDiscordId(subjectId)) return;
  await leavePresence(subjectId, user.id);
}

export async function presenceSnapshot(subjectIds: string[]): Promise<Record<string, Viewer[]>> {
  const user = await requireUser({ rank: "recruteur" });
  return presenceFor(subjectIds.slice(0, 200), user.id);
}

export type DecisionState = (ReviewResult & { at: number }) | null;

/** Formulaire de décision de la fiche joueur (un seul point d'entrée, l'action est dans le champ `decision`). */
export async function decide(_previous: DecisionState, formData: FormData): Promise<DecisionState> {
  const decision = String(formData.get("decision"));
  const subjectId = String(formData.get("subjectId"));
  const applicationId = String(formData.get("applicationId"));
  const reviewer = await freshActor(decision === "supprimer" ? "admin" : "recruteur");
  if (!reviewer) return { error: "Tes permissions ont changé : recharge la page.", at: Date.now() };
  if (!(await rateLimit("decision", reviewer.id))) return { error: RATE_LIMIT_MESSAGE, at: Date.now() };

  const [application] = await db().select().from(schema.applications).where(eq(schema.applications.id, applicationId));
  if (!application || application.userId !== subjectId) return { error: "Candidature introuvable : recharge la fiche.", at: Date.now() };
  // Personne ne décide de sa propre candidature, ni ne fait avancer celle d'un joueur blacklisté.
  if (subjectId === reviewer.id) return { error: "Tu ne peux pas décider de ta propre candidature.", at: Date.now() };
  if (decision !== "supprimer" && (await getBlacklistEntry(subjectId))) return { error: "Ce joueur est blacklisté : lève d'abord la blacklist.", at: Date.now() };

  const comment = String(formData.get("comment") ?? "");
  let result: ReviewResult;
  switch (decision) {
    case "valider":
      result = await validateWritten(application, reviewer);
      break;
    case "modifier":
      result = await requestChanges(application, reviewer, formData.getAll("steps").map(String), comment);
      break;
    case "refuser":
      result = await refuse(application, reviewer, formData.getAll("criteria").map(String), comment);
      break;
    case "entretien":
      result = await validateInterview(application, reviewer);
      break;
    case "supprimer":
      result = await wipeApplication(application, reviewer);
      break;
    default:
      result = { error: "Action inconnue." };
  }
  if ("ok" in result) {
    revalidatePath(`/equipe/joueurs/${subjectId}`);
    revalidatePath("/equipe");
  }
  return { ...result, at: Date.now() };
}

export type NoteState = { error?: string; at: number } | null;

export async function addNoteAction(_previous: NoteState, formData: FormData): Promise<NoteState> {
  const author = await freshActor("recruteur");
  if (!author) return { error: "Tes permissions ont changé : recharge la page.", at: Date.now() };
  if (!(await rateLimit("note", author.id))) return { error: RATE_LIMIT_MESSAGE, at: Date.now() };
  const subjectId = String(formData.get("subjectId"));
  const visibility: NoteVisibility = formData.get("visibility") === "admin" ? "admin" : "equipe";
  const result = await addNote(subjectId, author, String(formData.get("content") ?? ""), visibility);
  if ("error" in result) return { error: result.error, at: Date.now() };
  revalidatePath(`/equipe/joueurs/${subjectId}`);
  return { at: Date.now() };
}

export async function deleteNoteAction(formData: FormData) {
  const viewer = await freshActor("recruteur");
  if (!viewer || !(await rateLimit("noteDelete", viewer.id))) return;
  const result = await deleteNote(String(formData.get("noteId")), viewer);
  if ("subjectId" in result && result.subjectId) revalidatePath(`/equipe/joueurs/${result.subjectId}`);
}

export type DeleteAccountState = { error: string; at: number } | null;

/** Admin : suppression d'un compte demandée par ticket. Confirmation par le mot SUPPRIMER. */
export async function deleteAccountAction(_previous: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const reviewer = await freshActor("admin");
  if (!reviewer) return { error: "Réservé aux admins.", at: Date.now() };
  if (!(await rateLimit("accountDelete", reviewer.id))) return { error: RATE_LIMIT_MESSAGE, at: Date.now() };
  if (String(formData.get("confirmation") ?? "").trim().toUpperCase() !== "SUPPRIMER") return { error: "Recopie SUPPRIMER pour confirmer.", at: Date.now() };

  const result = await deletePlayerAccount(String(formData.get("subjectId")), reviewer);
  if ("error" in result) return { error: result.error, at: Date.now() };
  revalidatePath("/equipe");
  // Seulement le nombre d'avertissements dans l'adresse : jamais de texte libre qu'un lien piégé pourrait imiter.
  redirect(`/equipe?onglet=tous&supprime=1${result.warnings.length ? `&avertissements=${result.warnings.length}` : ""}`);
}

export type SanctionState = (ReviewResult & { at: number }) | null;

/** Admin : retrait de whitelist, blacklist ou levée de la blacklist (champ `sanction`). */
export async function sanctionAction(_previous: SanctionState, formData: FormData): Promise<SanctionState> {
  const reviewer = await freshActor("admin");
  if (!reviewer) return { error: "Réservé aux admins.", at: Date.now() };
  if (!(await rateLimit("sanction", reviewer.id))) return { error: RATE_LIMIT_MESSAGE, at: Date.now() };

  const subjectId = String(formData.get("subjectId"));
  const reason = String(formData.get("reason") ?? "");
  let result: ReviewResult;
  switch (String(formData.get("sanction"))) {
    case "retirer":
      result = await revokeWhitelist(subjectId, reviewer, reason);
      break;
    case "blacklist":
      // La confirmation est aussi vérifiée ici : un envoi sans elle (script, vieux formulaire) ne bannit personne.
      result =
        String(formData.get("confirmation") ?? "").trim().toUpperCase() === "BLACKLIST"
          ? await blacklistPlayer(subjectId, reviewer, reason)
          : { error: "Recopie BLACKLIST pour confirmer." };
      break;
    case "lever":
      result = await liftBlacklist(subjectId, reviewer);
      break;
    default:
      result = { error: "Action inconnue." };
  }
  if ("ok" in result) {
    revalidatePath(`/equipe/joueurs/${subjectId}`);
    revalidatePath("/equipe");
  }
  return { ...result, at: Date.now() };
}
