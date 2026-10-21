import "server-only";
import { asc } from "drizzle-orm";
import { cache } from "react";
import type { EmblemName } from "@/components/site/emblem";
import { isEmblemName } from "@/components/site/emblem";
import type { Affinity, Creature } from "@/content/lore";
import { AFFINITIES, CREATURES } from "@/content/lore";
import { db, schema } from "@/db";
import type { Faction, FactionKind } from "@/db/schema";

/** État géré depuis l'administration. */
export interface FactionState {
  joinOpen: boolean;
  leadOpen: boolean;
  archived: boolean;
  sortOrder: number;
  /** D'origine : lore dans le code, non modifiable depuis le site. */
  builtin: boolean;
}

export type AffinityView = Omit<Affinity, "id"> & { id: string } & FactionState;
export type CreatureView = Omit<Creature, "id"> & { id: string } & FactionState;

/** Champs de lore saisis dans l'administration pour une affinité ou une créature ajoutée. */
export const LORE_FIELDS: Record<FactionKind, { key: string; label: string; long?: boolean; max: number }[]> = {
  affinite: [
    { key: "god", label: "Dieu (ou « Sans dieu »)", max: 40 },
    { key: "element", label: "Pouvoir ou élément", max: 40 },
    { key: "values", label: "Valeurs", max: 120 },
    { key: "hook", label: "Accroche (une phrase)", max: 160 },
    { key: "text", label: "Description", long: true, max: 600 },
  ],
  creature: [
    { key: "originShort", label: "Origine en deux ou trois mots", max: 40 },
    { key: "origin", label: "Origine", long: true, max: 400 },
    { key: "strengthShort", label: "Force en deux ou trois mots", max: 40 },
    { key: "strengths", label: "Capacités", long: true, max: 400 },
    { key: "weaknessShort", label: "Faiblesse en deux ou trois mots", max: 40 },
    { key: "weaknesses", label: "Faiblesses", long: true, max: 400 },
    { key: "friendly", label: "Affinité amicale", max: 160 },
  ],
};

const text = (lore: Record<string, string | boolean>, key: string) => (typeof lore[key] === "string" ? (lore[key] as string) : "");

function state(row: Faction | undefined, index: number, builtin: boolean): FactionState {
  return {
    joinOpen: row?.joinOpen ?? true,
    leadOpen: row?.leadOpen ?? true,
    archived: row?.archived ?? false,
    sortOrder: row?.sortOrder ?? index + 1,
    builtin,
  };
}

function emblemOf(lore: Record<string, string | boolean>, fallback: EmblemName): EmblemName {
  const value = text(lore, "emblem");
  return isEmblemName(value) ? value : fallback;
}

function customAffinity(row: Faction): AffinityView {
  const lore = row.lore ?? {};
  return {
    id: row.id,
    name: text(lore, "name"),
    god: text(lore, "god"),
    element: text(lore, "element"),
    values: text(lore, "values"),
    text: text(lore, "text"),
    hook: text(lore, "hook"),
    emblem: emblemOf(lore, "laurel"),
    art: `${text(lore, "name")} : illustration à produire`,
    divine: lore.divine !== false,
    ...state(row, 0, false),
  };
}

function customCreature(row: Faction): CreatureView {
  const lore = row.lore ?? {};
  return {
    id: row.id,
    name: text(lore, "name"),
    origin: text(lore, "origin"),
    originShort: text(lore, "originShort"),
    strengths: text(lore, "strengths"),
    strengthShort: text(lore, "strengthShort"),
    weaknesses: text(lore, "weaknesses"),
    weaknessShort: text(lore, "weaknessShort"),
    friendly: text(lore, "friendly"),
    emblem: emblemOf(lore, "eye"),
    art: `${text(lore, "name")} : illustration à produire`,
    ...state(row, 0, false),
  };
}

async function loadRows(): Promise<Faction[] | null> {
  try {
    return await db().select().from(schema.factions).orderBy(asc(schema.factions.sortOrder));
  } catch (error) {
    // Base injoignable (build local, panne) : les affinités et créatures d'origine, toutes ouvertes.
    console.error("Lecture des affinités et créatures impossible", error);
    return null;
  }
}

/**
 * Affinités et créatures, triées, avec leur disponibilité. Les archivées ne sont incluses
 * que sur demande (administration, anciennes candidatures).
 */
export const getFactions = cache(async (includeArchived = false) => {
  const rows = (await loadRows()) ?? [];
  const byId = new Map(rows.map(row => [row.id, row]));
  const builtinIds = new Set<string>([...AFFINITIES, ...CREATURES].map(item => item.id));

  const affinities: AffinityView[] = [
    ...AFFINITIES.map((item, index) => ({ ...item, ...state(byId.get(item.id), index, true) })),
    ...rows.filter(row => row.kind === "affinite" && !builtinIds.has(row.id)).map(customAffinity),
  ];
  const creatures: CreatureView[] = [
    ...CREATURES.map((item, index) => ({ ...item, ...state(byId.get(item.id), index, true) })),
    ...rows.filter(row => row.kind === "creature" && !builtinIds.has(row.id)).map(customCreature),
  ];

  const keep = <T extends FactionState>(items: T[]) => items.filter(item => includeArchived || !item.archived).sort((a, b) => a.sortOrder - b.sortOrder);
  return { affinities: keep(affinities), creatures: keep(creatures) };
});

/** Nom affiché de chaque affinité et créature (archivées comprises), pour les récapitulatifs. */
export async function factionNames() {
  const { affinities, creatures } = await getFactions(true);
  return Object.fromEntries([...affinities, ...creatures].map(item => [item.id, item.name])) as Record<string, string>;
}
