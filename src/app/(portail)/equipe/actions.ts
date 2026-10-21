"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import type { NoteVisibility, Rank } from "@/db/schema";
import { syncMember } from "@/lib/members";
import type { ReviewResult } from "@/lib/review";
import { addNote, deleteNote, refuse, requestChanges, validateInterview, validateWritten, wipeApplication } from "@/lib/review";
import { hasRank, requireUser } from "@/lib/session";
import type { Viewer } from "@/lib/staff";
import { leavePresence, presenceFor, touchPresence } from "@/lib/staff";

/** Droits relus sur Discord avant toute action sensible : un rôle retiré il y a une minute ne permet plus de décider. */
async function requireFreshRank(minimum: Rank) {
  const user = await requireUser({ rank: "recruteur" });
  const { rank } = await syncMember(user.id).catch(() => ({ rank: user.rank }));
  if (!hasRank({ rank }, minimum)) throw new Error("Permissions insuffisantes.");
  return { ...user, rank };
}

export async function heartbeat(subjectId: string): Promise<Viewer[]> {
  const user = await requireUser({ rank: "recruteur" });
  await touchPresence(subjectId, user.id);
  return (await presenceFor([subjectId], user.id))[subjectId] ?? [];
}

export async function leaveProfile(subjectId: string) {
  const user = await requireUser({ rank: "recruteur" });
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
  let reviewer;
  try {
    reviewer = await requireFreshRank(decision === "supprimer" ? "staff" : "recruteur");
  } catch {
    return { error: "Tes permissions ont changé : recharge la page.", at: Date.now() };
  }

  const [application] = await db().select().from(schema.applications).where(eq(schema.applications.id, applicationId)).orderBy(desc(schema.applications.createdAt));
  if (!application || application.userId !== subjectId) return { error: "Candidature introuvable : recharge la fiche.", at: Date.now() };

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
  let author;
  try {
    author = await requireFreshRank("recruteur");
  } catch {
    return { error: "Tes permissions ont changé : recharge la page.", at: Date.now() };
  }
  const subjectId = String(formData.get("subjectId"));
  const visibility: NoteVisibility = formData.get("visibility") === "staff" ? "staff" : "equipe";
  const result = await addNote(subjectId, author, String(formData.get("content") ?? ""), visibility);
  if ("error" in result) return { error: result.error, at: Date.now() };
  revalidatePath(`/equipe/joueurs/${subjectId}`);
  return { at: Date.now() };
}

export async function deleteNoteAction(formData: FormData) {
  const viewer = await requireFreshRank("recruteur").catch(() => null);
  if (!viewer) return;
  const result = await deleteNote(String(formData.get("noteId")), viewer);
  if ("subjectId" in result && result.subjectId) revalidatePath(`/equipe/joueurs/${result.subjectId}`);
}
