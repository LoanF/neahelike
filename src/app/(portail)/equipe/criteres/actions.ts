"use server";

import { revalidatePath } from "next/cache";
import type { AdminResult } from "@/lib/admin";
import { createCriterion, moveCriterion, setCriterionActive, updateCriterion } from "@/lib/admin";
import { requireFreshRank } from "@/lib/session";

export type CriterionFormState = (AdminResult & { at: number }) | null;

async function admin() {
  try {
    return await requireFreshRank("admin");
  } catch {
    return null;
  }
}

export async function toggleCriterionAction(formData: FormData) {
  const user = await admin();
  if (!user) return;
  await setCriterionActive(String(formData.get("id")), formData.get("value") === "true", user.id);
  revalidatePath("/equipe/criteres");
}

export async function moveCriterionAction(formData: FormData) {
  const user = await admin();
  if (!user) return;
  await moveCriterion(String(formData.get("id")), formData.get("direction") === "up" ? -1 : 1, user.id);
  revalidatePath("/equipe/criteres");
}

export async function saveCriterionAction(_previous: CriterionFormState, formData: FormData): Promise<CriterionFormState> {
  const user = await admin();
  if (!user) return { error: "Réservé aux admins.", at: Date.now() };
  const id = String(formData.get("id") ?? "");
  const result = id ? await updateCriterion(id, formData, user.id) : await createCriterion(formData, user.id);
  if ("ok" in result) revalidatePath("/equipe/criteres");
  return { ...result, at: Date.now() };
}
