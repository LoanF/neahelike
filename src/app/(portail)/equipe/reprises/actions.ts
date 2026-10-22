"use server";

import { revalidatePath } from "next/cache";
import type { AdminResult } from "@/lib/admin";
import { createBusiness, moveBusiness, setBusinessFlag, updateBusiness } from "@/lib/admin";
import { RATE_LIMIT_MESSAGE, rateLimit } from "@/lib/rate-limit";
import { requireFreshRank } from "@/lib/session";

export type BusinessFormState = (AdminResult & { at: number }) | null;

async function admin() {
  try {
    return await requireFreshRank("admin");
  } catch {
    return null;
  }
}

export async function toggleBusinessAction(formData: FormData) {
  const user = await admin();
  const flag = formData.get("flag") === "archived" ? "archived" : "open";
  if (!user || !(await rateLimit("admin", user.id))) return;
  await setBusinessFlag(String(formData.get("id")), flag, formData.get("value") === "true", user.id);
  revalidatePath("/equipe/reprises");
}

export async function moveBusinessAction(formData: FormData) {
  const user = await admin();
  if (!user || !(await rateLimit("admin", user.id))) return;
  await moveBusiness(String(formData.get("id")), formData.get("direction") === "up" ? -1 : 1, user.id);
  revalidatePath("/equipe/reprises");
}

export async function saveBusinessAction(_previous: BusinessFormState, formData: FormData): Promise<BusinessFormState> {
  const user = await admin();
  if (!user) return { error: "Réservé aux admins.", at: Date.now() };
  if (!(await rateLimit("admin", user.id))) return { error: RATE_LIMIT_MESSAGE, at: Date.now() };
  const id = String(formData.get("id") ?? "");
  const result = id ? await updateBusiness(id, formData, user.id) : await createBusiness(formData, user.id);
  if ("ok" in result) revalidatePath("/equipe/reprises");
  return { ...result, at: Date.now() };
}
