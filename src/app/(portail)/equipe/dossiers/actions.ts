"use server";

import type { VerdictState } from "@/components/equipe/verdict-form";
import { RATE_LIMIT_MESSAGE, rateLimit } from "@/lib/rate-limit";
import { freshActor } from "@/lib/session";
import { decideDossier } from "@/lib/takeovers";

/** Accepter ou refuser un dossier de reprise déposé à part (recruteur ou plus). */
export async function decideDossierAction(_previous: VerdictState | null, formData: FormData): Promise<VerdictState> {
  const reviewer = await freshActor("recruteur");
  if (!reviewer) return { error: "Tes permissions ont changé : recharge la page.", at: Date.now() };
  if (!(await rateLimit("decision", reviewer.id))) return { error: RATE_LIMIT_MESSAGE, at: Date.now() };
  const result = await decideDossier(String(formData.get("id") ?? ""), reviewer, formData.get("verdict") === "accepter", String(formData.get("comment") ?? ""));
  // Pas de rafraîchissement : la carte reste affichée avec sa confirmation (et les avertissements Discord)
  // jusqu'au prochain chargement, qui relit tout (pages dynamiques).
  return { ...result, at: Date.now() };
}
