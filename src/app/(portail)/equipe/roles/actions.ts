"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/discord";
import type { RoleRank } from "@/lib/permissions";
import { addOwner, removeOwner, saveRoleRanks } from "@/lib/permissions";
import { RATE_LIMIT_MESSAGE, rateLimit } from "@/lib/rate-limit";
import { requireFreshRank } from "@/lib/session";

export type FormState = { error?: string; ok?: string; at: number } | null;

const SNOWFLAKE = /^\d{15,21}$/;
const RANKS: RoleRank[] = ["joueur", "recruteur", "admin"];

async function owner() {
  try {
    return await requireFreshRank("owner");
  } catch {
    return null;
  }
}

/** Tableau complet des rôles : un champ `rank:<id>` par rôle, et `name:<id>` pour le journal. */
export async function saveRolesAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const user = await owner();
  if (!user) return { error: "Réservé aux owners.", at: Date.now() };
  if (!(await rateLimit("admin", user.id))) return { error: RATE_LIMIT_MESSAGE, at: Date.now() };

  const ranks: Record<string, RoleRank> = {};
  const names: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    const [kind, id] = key.split(":");
    if (!id || !SNOWFLAKE.test(id)) continue;
    if (kind === "rank" && RANKS.includes(value as RoleRank)) ranks[id] = value as RoleRank;
    if (kind === "name") names[id] = String(value).slice(0, 100);
  }
  await saveRoleRanks(ranks, names, user.id);
  revalidatePath("/equipe/roles");
  return { ok: "Permissions enregistrées. Chacun aura ses nouveaux droits à sa prochaine page.", at: Date.now() };
}

export async function addOwnerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const user = await owner();
  if (!user) return { error: "Réservé aux owners.", at: Date.now() };
  if (!(await rateLimit("admin", user.id))) return { error: RATE_LIMIT_MESSAGE, at: Date.now() };
  const id = String(formData.get("discordId") ?? "").trim();
  if (!SNOWFLAKE.test(id)) return { error: "Indique un ID Discord valide (mode développeur → clic droit → Copier l'identifiant).", at: Date.now() };
  // Vérifie que le compte existe, pour éviter une faute de frappe.
  const discordUser = await getUser(id).catch(() => null);
  if (!discordUser) return { error: "Aucun compte Discord ne correspond à cet ID.", at: Date.now() };
  await addOwner(id, user.id);
  revalidatePath("/equipe/roles");
  return { ok: `${discordUser.global_name ?? discordUser.username} est maintenant owner.`, at: Date.now() };
}

export async function removeOwnerAction(formData: FormData) {
  const user = await owner();
  if (!user || !(await rateLimit("admin", user.id))) return;
  await removeOwner(String(formData.get("discordId")), user.id);
  revalidatePath("/equipe/roles");
}
