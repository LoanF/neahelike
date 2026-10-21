import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isEmblemName } from "@/components/site/emblem";
import { db, schema } from "@/db";
import type { FactionKind } from "@/db/schema";
import { logEvent } from "./events";
import { getFactions, LORE_FIELDS } from "./factions";

export type AdminResult = { ok: true } | { error: string };

/** Identifiant lisible à partir d'un nom (« Les Harpies » → « les-harpies »). */
export function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

/** Pages publiques qui affichent les disponibilités. */
function refreshPublicPages() {
  revalidatePath("/");
  revalidatePath("/lore");
}

/* ---------- Affinités et créatures ---------- */

export type FactionFlag = "joinOpen" | "leadOpen" | "archived";

export async function setFactionFlag(id: string, flag: FactionFlag, value: boolean, adminId: string): Promise<AdminResult> {
  const { affinities, creatures } = await getFactions(true);
  const faction = [...affinities, ...creatures].find(item => item.id === id);
  if (!faction) return { error: "Introuvable." };
  const kind: FactionKind = affinities.some(item => item.id === id) ? "affinite" : "creature";
  await db()
    .insert(schema.factions)
    .values({ id, kind, sortOrder: faction.sortOrder, [flag]: value })
    .onConflictDoUpdate({ target: schema.factions.id, set: { [flag]: value } });
  await logEvent({ type: "faction.modifiee", subjectId: null, actorId: adminId, data: { id, nom: faction.name, [flag]: value } });
  refreshPublicPages();
  return { ok: true };
}

/** Monte ou descend d'un cran dans sa liste (affinités ou créatures). */
export async function moveFaction(id: string, direction: -1 | 1, adminId: string): Promise<AdminResult> {
  const { affinities, creatures } = await getFactions(true);
  const list = affinities.some(item => item.id === id) ? affinities : creatures;
  const kind: FactionKind = list === affinities ? "affinite" : "creature";
  const index = list.findIndex(item => item.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= list.length) return { ok: true };
  const order = [...list];
  [order[index], order[target]] = [order[target], order[index]];
  await db().transaction(async tx => {
    for (const [position, item] of order.entries()) {
      await tx
        .insert(schema.factions)
        .values({ id: item.id, kind, sortOrder: position + 1 })
        .onConflictDoUpdate({ target: schema.factions.id, set: { sortOrder: position + 1 } });
    }
  });
  await logEvent({ type: "faction.modifiee", subjectId: null, actorId: adminId, data: { id, nom: list[index].name, ordre: target + 1 } });
  refreshPublicPages();
  return { ok: true };
}

/** Lore saisi dans le formulaire : tous les champs du type sont obligatoires. */
function readLore(kind: FactionKind, form: FormData): Record<string, string | boolean> | { error: string } {
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 40) return { error: "Le nom doit faire entre 2 et 40 caractères." };
  const emblem = String(form.get("emblem") ?? "");
  if (!isEmblemName(emblem)) return { error: "Choisis un emblème." };
  const lore: Record<string, string | boolean> = { name, emblem };
  for (const field of LORE_FIELDS[kind]) {
    const value = String(form.get(field.key) ?? "").trim();
    if (!value) return { error: `« ${field.label} » est obligatoire.` };
    if (value.length > field.max) return { error: `« ${field.label} » : ${field.max} caractères maximum.` };
    lore[field.key] = value;
  }
  if (kind === "affinite") lore.divine = form.get("divine") === "on";
  return lore;
}

export async function createFaction(kind: FactionKind, form: FormData, adminId: string): Promise<AdminResult> {
  const lore = readLore(kind, form);
  if ("error" in lore) return { error: lore.error as string };
  const id = slugify(String(lore.name));
  if (!id) return { error: "Nom invalide." };
  const { affinities, creatures } = await getFactions(true);
  if ([...affinities, ...creatures].some(item => item.id === id)) return { error: "Ce nom existe déjà (même archivé)." };
  const list = kind === "affinite" ? affinities : creatures;
  await db().insert(schema.factions).values({ id, kind, lore, sortOrder: list.length + 1 });
  await logEvent({ type: "faction.ajoutee", subjectId: null, actorId: adminId, data: { id, nom: lore.name, type: kind } });
  refreshPublicPages();
  return { ok: true };
}

/** Seules les affinités et créatures ajoutées depuis le site ont un lore modifiable ici. */
export async function updateFaction(id: string, form: FormData, adminId: string): Promise<AdminResult> {
  const [row] = await db().select().from(schema.factions).where(eq(schema.factions.id, id));
  if (!row?.lore) return { error: "Le lore de celle-ci est dans le code du site." };
  const lore = readLore(row.kind, form);
  if ("error" in lore) return { error: lore.error as string };
  await db().update(schema.factions).set({ lore }).where(eq(schema.factions.id, id));
  await logEvent({ type: "faction.modifiee", subjectId: null, actorId: adminId, data: { id, nom: lore.name, lore: true } });
  refreshPublicPages();
  return { ok: true };
}

/* ---------- Entreprises ---------- */

function readBusiness(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (name.length < 2 || name.length > 60) return { error: "Le nom doit faire entre 2 et 60 caractères." };
  if (description.length > 200) return { error: "Description : 200 caractères maximum." };
  return { name, description };
}

export async function createBusiness(form: FormData, adminId: string): Promise<AdminResult> {
  const fields = readBusiness(form);
  if ("error" in fields) return { error: fields.error as string };
  const id = slugify(fields.name);
  if (!id || id === "nouvelle") return { error: "Nom invalide." };
  const [existing] = await db().select({ id: schema.businesses.id }).from(schema.businesses).where(eq(schema.businesses.id, id));
  if (existing) return { error: "Une entreprise porte déjà ce nom (même archivée)." };
  const count = (await db().select({ id: schema.businesses.id }).from(schema.businesses)).length;
  await db().insert(schema.businesses).values({ id, ...fields, sortOrder: count + 1 });
  await logEvent({ type: "entreprise.ajoutee", subjectId: null, actorId: adminId, data: { id, nom: fields.name } });
  return { ok: true };
}

export async function updateBusiness(id: string, form: FormData, adminId: string): Promise<AdminResult> {
  const fields = readBusiness(form);
  if ("error" in fields) return { error: fields.error as string };
  await db().update(schema.businesses).set(fields).where(eq(schema.businesses.id, id));
  await logEvent({ type: "entreprise.modifiee", subjectId: null, actorId: adminId, data: { id, nom: fields.name } });
  return { ok: true };
}

export async function setBusinessFlag(id: string, flag: "open" | "archived", value: boolean, adminId: string): Promise<AdminResult> {
  const [row] = await db().update(schema.businesses).set({ [flag]: value }).where(eq(schema.businesses.id, id)).returning();
  if (!row) return { error: "Introuvable." };
  await logEvent({ type: "entreprise.modifiee", subjectId: null, actorId: adminId, data: { id, nom: row.name, [flag]: value } });
  return { ok: true };
}

export async function moveBusiness(id: string, direction: -1 | 1, adminId: string): Promise<AdminResult> {
  const list = await db().select().from(schema.businesses).where(eq(schema.businesses.archived, false)).orderBy(asc(schema.businesses.sortOrder), asc(schema.businesses.name));
  const index = list.findIndex(item => item.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= list.length) return { ok: true };
  [list[index], list[target]] = [list[target], list[index]];
  await db().transaction(async tx => {
    for (const [position, item] of list.entries()) await tx.update(schema.businesses).set({ sortOrder: position + 1 }).where(and(eq(schema.businesses.id, item.id)));
  });
  await logEvent({ type: "entreprise.modifiee", subjectId: null, actorId: adminId, data: { id, nom: list[target].name, ordre: target + 1 } });
  return { ok: true };
}

/* ---------- Critères de refus ---------- */

function readLabel(form: FormData) {
  const label = String(form.get("label") ?? "").trim();
  if (label.length < 3 || label.length > 80) return { error: "Le libellé doit faire entre 3 et 80 caractères." };
  return { label };
}

export async function createCriterion(form: FormData, adminId: string): Promise<AdminResult> {
  const fields = readLabel(form);
  if ("error" in fields) return { error: fields.error as string };
  const id = slugify(fields.label);
  const existing = await db().select({ id: schema.refusalCriteria.id }).from(schema.refusalCriteria);
  if (!id || existing.some(row => row.id === id)) return { error: "Un critère proche existe déjà (même désactivé)." };
  await db().insert(schema.refusalCriteria).values({ id, label: fields.label, sortOrder: existing.length + 1 });
  await logEvent({ type: "critere.ajoute", subjectId: null, actorId: adminId, data: { id, libelle: fields.label } });
  return { ok: true };
}

export async function updateCriterion(id: string, form: FormData, adminId: string): Promise<AdminResult> {
  const fields = readLabel(form);
  if ("error" in fields) return { error: fields.error as string };
  await db().update(schema.refusalCriteria).set(fields).where(eq(schema.refusalCriteria.id, id));
  await logEvent({ type: "critere.modifie", subjectId: null, actorId: adminId, data: { id, libelle: fields.label } });
  return { ok: true };
}

export async function setCriterionActive(id: string, active: boolean, adminId: string): Promise<AdminResult> {
  const [row] = await db().update(schema.refusalCriteria).set({ active }).where(eq(schema.refusalCriteria.id, id)).returning();
  if (!row) return { error: "Introuvable." };
  await logEvent({ type: "critere.modifie", subjectId: null, actorId: adminId, data: { id, libelle: row.label, actif: active } });
  return { ok: true };
}

export async function moveCriterion(id: string, direction: -1 | 1, adminId: string): Promise<AdminResult> {
  const list = await db().select().from(schema.refusalCriteria).orderBy(asc(schema.refusalCriteria.sortOrder));
  const index = list.findIndex(item => item.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= list.length) return { ok: true };
  [list[index], list[target]] = [list[target], list[index]];
  await db().transaction(async tx => {
    for (const [position, item] of list.entries()) await tx.update(schema.refusalCriteria).set({ sortOrder: position + 1 }).where(eq(schema.refusalCriteria.id, item.id));
  });
  await logEvent({ type: "critere.modifie", subjectId: null, actorId: adminId, data: { id, libelle: list[target].label, ordre: target + 1 } });
  return { ok: true };
}
