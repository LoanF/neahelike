"use server";

import { revalidatePath } from "next/cache";
import type { FactionKind } from "@/db/schema";
import type { AdminResult, FactionFlag } from "@/lib/admin";
import { createFaction, moveFaction, setFactionFlag, updateFaction } from "@/lib/admin";
import { RATE_LIMIT_MESSAGE, rateLimit } from "@/lib/rate-limit";
import { requireFreshRank } from "@/lib/session";

export type FactionFormState = (AdminResult & { at: number }) | null;

async function admin() {
  try {
    return await requireFreshRank("admin");
  } catch {
    return null;
  }
}

const FLAGS: FactionFlag[] = ["joinOpen", "leadOpen", "archived"];

export async function toggleFactionAction(formData: FormData) {
  const user = await admin();
  const flag = String(formData.get("flag")) as FactionFlag;
  if (!user || !FLAGS.includes(flag) || !(await rateLimit("admin", user.id))) return;
  await setFactionFlag(String(formData.get("id")), flag, formData.get("value") === "true", user.id);
  revalidatePath("/equipe/factions");
}

export async function moveFactionAction(formData: FormData) {
  const user = await admin();
  if (!user || !(await rateLimit("admin", user.id))) return;
  await moveFaction(String(formData.get("id")), formData.get("direction") === "up" ? -1 : 1, user.id);
  revalidatePath("/equipe/factions");
}

export async function saveFactionAction(_previous: FactionFormState, formData: FormData): Promise<FactionFormState> {
  const user = await admin();
  if (!user) return { error: "Réservé aux admins.", at: Date.now() };
  if (!(await rateLimit("admin", user.id))) return { error: RATE_LIMIT_MESSAGE, at: Date.now() };
  const id = String(formData.get("id") ?? "");
  const kind = formData.get("kind") === "creature" ? "creature" : ("affinite" as FactionKind);
  const result = id ? await updateFaction(id, formData, user.id) : await createFaction(kind, formData, user.id);
  if ("ok" in result) revalidatePath("/equipe/factions");
  return { ...result, at: Date.now() };
}
