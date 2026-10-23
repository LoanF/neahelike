import "server-only";
import type { AnyColumn } from "drizzle-orm";
import { and, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { TeamBadge, TabId } from "@/components/equipe/badges";
import { TABS } from "@/components/equipe/badges";
import { db, schema } from "@/db";
import type { Application, NoteVisibility, User } from "@/db/schema";
import { isStepComplete, wantsDossier } from "./application";
import { blacklistedIds } from "./blacklist";
import { hasRank } from "./session";

/** Une fiche est « en cours de lecture » si son lecteur a donné signe de vie il y a moins de 30 s. */
const PRESENCE_WINDOW_SECONDS = 30;

/** Badge de la liste et de la fiche (hors œil de présence, calculé en direct). */
export function teamBadge(application: Application | null, blacklisted = false): TeamBadge {
  if (blacklisted) return "blacklist";
  if (!application) return "aucune";
  switch (application.status) {
    case "brouillon":
      return wantsDossier(application) && !isStepComplete(application, "dossier") ? "dossier" : "brouillon";
    case "envoyee":
      return application.viewedAt ? "vue" : "a_lire";
    case "whitelistee":
      return application.whitelistRevokedAt ? "retiree" : "whitelistee";
    default:
      return application.status;
  }
}

export interface PlayerRow {
  user: User;
  application: Application | null;
  badge: TeamBadge;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function matches(row: PlayerRow, query: string) {
  const rp = row.application?.rp;
  const haystack = [row.user.id, row.user.username, row.user.globalName, rp?.firstName, rp?.lastName, [rp?.firstName, rp?.lastName].filter(Boolean).join(" ")]
    .filter((value): value is string => typeof value === "string")
    .map(normalize);
  return haystack.some(value => value.includes(query));
}

/** Joueurs avec leur dernière candidature, filtrés par onglet et recherche (ID Discord, pseudo, prénom ou nom RP). */
export async function listPlayers({ tab, query }: { tab: TabId; query?: string }) {
  const [users, applications, blacklisted] = await Promise.all([
    db().select().from(schema.users).orderBy(desc(schema.users.createdAt)),
    db().select().from(schema.applications).orderBy(desc(schema.applications.createdAt)),
    blacklistedIds(),
  ]);
  const latest = new Map<string, Application>();
  for (const application of applications) if (!latest.has(application.userId)) latest.set(application.userId, application);

  const rows: PlayerRow[] = users.map(user => {
    const application = latest.get(user.id) ?? null;
    return { user, application, badge: teamBadge(application, blacklisted.has(user.id)) };
  });

  const counts = Object.fromEntries(TABS.map(item => [item.id, item.badges ? rows.filter(row => (item.badges as readonly TeamBadge[]).includes(row.badge)).length : rows.length])) as Record<TabId, number>;

  const current = TABS.find(item => item.id === tab) ?? TABS[0];
  const needle = query ? normalize(query) : "";
  const filtered = rows
    .filter(row => !current.badges || (current.badges as readonly TeamBadge[]).includes(row.badge))
    .filter(row => !needle || matches(row, needle));

  // À traiter : les plus anciennes d'abord, pour ne laisser personne attendre.
  if (current.id === "a-traiter") filtered.sort((a, b) => (a.application?.submittedAt?.getTime() ?? 0) - (b.application?.submittedAt?.getTime() ?? 0));

  return { rows: filtered, counts };
}

export interface Viewer {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}

/** Membres de l'équipe qui consultent ces fiches en ce moment, par joueur. */
export async function presenceFor(subjectIds: string[] | null, excludeViewer?: string): Promise<Record<string, Viewer[]>> {
  const rows = await db()
    .select({
      subjectId: schema.profileViews.subjectId,
      id: schema.users.id,
      username: schema.users.username,
      globalName: schema.users.globalName,
      avatar: schema.users.avatar,
    })
    .from(schema.profileViews)
    .innerJoin(schema.users, eq(schema.users.id, schema.profileViews.viewerId))
    .where(
      and(
        gt(schema.profileViews.lastSeenAt, sql`now() - make_interval(secs => ${PRESENCE_WINDOW_SECONDS})`),
        subjectIds ? inArray(schema.profileViews.subjectId, subjectIds.length ? subjectIds : [""]) : undefined,
        excludeViewer ? ne(schema.profileViews.viewerId, excludeViewer) : undefined,
      ),
    );
  const result: Record<string, Viewer[]> = {};
  for (const { subjectId, ...viewer } of rows) (result[subjectId] ??= []).push(viewer);
  return result;
}

/** Signal de présence d'un membre de l'équipe sur une fiche. */
export async function touchPresence(subjectId: string, viewerId: string) {
  await db()
    .insert(schema.profileViews)
    .values({ subjectId, viewerId, lastSeenAt: new Date() })
    .onConflictDoUpdate({ target: [schema.profileViews.subjectId, schema.profileViews.viewerId], set: { lastSeenAt: new Date() } });
}

export async function leavePresence(subjectId: string, viewerId: string) {
  await db().delete(schema.profileViews).where(and(eq(schema.profileViews.subjectId, subjectId), eq(schema.profileViews.viewerId, viewerId)));
}

/**
 * Nom affiché d'un membre, côté SQL : même règle que `displayName` (lib/discord-cdn.ts).
 * `T` vaut `string | null` derrière une jointure externe.
 */
export function displayNameSql<T extends string | null = string>(table: { globalName: AnyColumn; username: AnyColumn }) {
  return sql<T>`coalesce(${table.globalName}, ${table.username})`;
}

const actor = alias(schema.users, "actor");

const subject = alias(schema.users, "subject");

const eventColumns = {
  id: schema.events.id,
  type: schema.events.type,
  data: schema.events.data,
  createdAt: schema.events.createdAt,
  actorId: schema.events.actorId,
  actorName: displayNameSql<string | null>(actor),
  actorAvatar: actor.avatar,
  subjectId: schema.events.subjectId,
  subjectName: displayNameSql<string | null>(subject),
};

/** Chronologie du joueur : ses étapes et les actions de l'équipe, de la plus récente à la plus ancienne. */
export async function timeline(subjectId: string) {
  return db()
    .select(eventColumns)
    .from(schema.events)
    .leftJoin(actor, eq(actor.id, schema.events.actorId))
    .leftJoin(subject, eq(subject.id, schema.events.subjectId))
    .where(eq(schema.events.subjectId, subjectId))
    .orderBy(desc(schema.events.createdAt))
    .limit(200);
}

/** Familles d'événements du journal global. */
export const JOURNAL_FILTERS = {
  candidatures: ["candidature.commencee", "candidature.etape", "candidature.envoyee"],
  decisions: ["candidature.vue", "candidature.validee", "candidature.modification", "candidature.refusee", "entretien.valide", "whitelist.retiree", "candidature.supprimee"],
  comptes: ["compte.cree", "compte.cgu", "compte.supprime", "compte.blacklist", "compte.blacklist_levee", "discord.rejoint", "discord.quitte", "rang.change"],
  notes: ["note.ajoutee"],
  administration: ["role.rang", "owner.ajoute", "owner.retire", "faction.ajoutee", "faction.modifiee", "entreprise.ajoutee", "entreprise.modifiee", "critere.ajoute", "critere.modifie"],
} as const;

export type JournalFilter = keyof typeof JOURNAL_FILTERS;

export const JOURNAL_PAGE_SIZE = 50;

/** Journal global (admins) : tous les événements, filtrés par famille, membre de l'équipe et période. */
export async function journal({ filter, actorId, days, page }: { filter?: JournalFilter; actorId?: string; days?: number; page: number }) {
  const conditions = [
    filter ? inArray(schema.events.type, [...JOURNAL_FILTERS[filter]]) : undefined,
    actorId ? eq(schema.events.actorId, actorId) : undefined,
    days ? gt(schema.events.createdAt, sql`now() - make_interval(days => ${days})`) : undefined,
  ];
  const rows = await db()
    .select(eventColumns)
    .from(schema.events)
    .leftJoin(actor, eq(actor.id, schema.events.actorId))
    .leftJoin(subject, eq(subject.id, schema.events.subjectId))
    .where(and(...conditions))
    .orderBy(desc(schema.events.createdAt))
    .limit(JOURNAL_PAGE_SIZE + 1)
    .offset(page * JOURNAL_PAGE_SIZE);
  return { entries: rows.slice(0, JOURNAL_PAGE_SIZE), hasMore: rows.length > JOURNAL_PAGE_SIZE };
}

/** Membres de l'équipe qui ont déjà agi, pour le filtre du journal. */
export async function journalActors() {
  return db()
    .selectDistinct({ id: actor.id, name: displayNameSql(actor) })
    .from(schema.events)
    .innerJoin(actor, eq(actor.id, schema.events.actorId))
    .where(inArray(actor.rank, ["recruteur", "admin", "owner"]));
}

export type TimelineEntry = Awaited<ReturnType<typeof timeline>>[number];

/** Visibilités qu'un membre de l'équipe peut lire : le recruteur ne voit pas les notes réservées aux admins. */
export function readableVisibilities(viewer: Pick<User, "rank">): NoteVisibility[] {
  return hasRank(viewer, "admin") ? ["equipe", "admin"] : ["equipe"];
}

const author = alias(schema.users, "author");

export async function notesFor(subjectId: string, viewer: Pick<User, "rank">) {
  return db()
    .select({
      id: schema.teamNotes.id,
      content: schema.teamNotes.content,
      visibility: schema.teamNotes.visibility,
      createdAt: schema.teamNotes.createdAt,
      authorId: schema.teamNotes.authorId,
      authorName: displayNameSql<string | null>(author),
      authorAvatar: author.avatar,
    })
    .from(schema.teamNotes)
    .leftJoin(author, eq(author.id, schema.teamNotes.authorId))
    .where(and(eq(schema.teamNotes.subjectId, subjectId), inArray(schema.teamNotes.visibility, readableVisibilities(viewer))))
    .orderBy(desc(schema.teamNotes.createdAt));
}

export type NoteEntry = Awaited<ReturnType<typeof notesFor>>[number];

/** Le recruteur supprime ses propres notes ; un admin peut supprimer toutes celles qu'il voit. */
export function canDeleteNote(note: Pick<NoteEntry, "authorId">, viewer: Pick<User, "id" | "rank">) {
  return hasRank(viewer, "admin") || note.authorId === viewer.id;
}
