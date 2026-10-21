import "server-only";
import { and, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { StaffBadge, TabId } from "@/components/staff/badges";
import { staffBadge, TABS } from "@/components/staff/badges";
import { db, schema } from "@/db";
import type { Application, NoteVisibility, User } from "@/db/schema";
import { hasRank } from "./session";

/** Une fiche est « en cours de lecture » si son lecteur a donné signe de vie il y a moins de 30 s. */
const PRESENCE_WINDOW_SECONDS = 30;

export interface PlayerRow {
  user: User;
  application: Application | null;
  badge: StaffBadge;
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
  const [users, applications] = await Promise.all([
    db().select().from(schema.users).orderBy(desc(schema.users.createdAt)),
    db().select().from(schema.applications).orderBy(desc(schema.applications.createdAt)),
  ]);
  const latest = new Map<string, Application>();
  for (const application of applications) if (!latest.has(application.userId)) latest.set(application.userId, application);

  const rows: PlayerRow[] = users.map(user => {
    const application = latest.get(user.id) ?? null;
    return { user, application, badge: staffBadge(application) };
  });

  const counts = Object.fromEntries(TABS.map(item => [item.id, item.badges ? rows.filter(row => (item.badges as readonly StaffBadge[]).includes(row.badge)).length : rows.length])) as Record<TabId, number>;

  const current = TABS.find(item => item.id === tab) ?? TABS[0];
  const needle = query ? normalize(query) : "";
  const filtered = rows
    .filter(row => !current.badges || (current.badges as readonly StaffBadge[]).includes(row.badge))
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

const actor = alias(schema.users, "actor");

/** Chronologie du joueur : ses étapes et les actions de l'équipe, de la plus récente à la plus ancienne. */
export async function timeline(subjectId: string) {
  return db()
    .select({
      id: schema.events.id,
      type: schema.events.type,
      data: schema.events.data,
      createdAt: schema.events.createdAt,
      actorId: schema.events.actorId,
      actorName: sql<string | null>`coalesce(${actor.globalName}, ${actor.username})`,
      actorAvatar: actor.avatar,
    })
    .from(schema.events)
    .leftJoin(actor, eq(actor.id, schema.events.actorId))
    .where(eq(schema.events.subjectId, subjectId))
    .orderBy(desc(schema.events.createdAt))
    .limit(200);
}

export type TimelineEntry = Awaited<ReturnType<typeof timeline>>[number];

/** Visibilités qu'un membre de l'équipe peut lire : le recruteur ne voit pas les notes réservées au staff. */
export function readableVisibilities(viewer: Pick<User, "rank">): NoteVisibility[] {
  return hasRank(viewer, "staff") ? ["equipe", "staff"] : ["equipe"];
}

const author = alias(schema.users, "author");

export async function notesFor(subjectId: string, viewer: Pick<User, "rank">) {
  return db()
    .select({
      id: schema.staffNotes.id,
      content: schema.staffNotes.content,
      visibility: schema.staffNotes.visibility,
      createdAt: schema.staffNotes.createdAt,
      authorId: schema.staffNotes.authorId,
      authorName: sql<string | null>`coalesce(${author.globalName}, ${author.username})`,
      authorAvatar: author.avatar,
    })
    .from(schema.staffNotes)
    .leftJoin(author, eq(author.id, schema.staffNotes.authorId))
    .where(and(eq(schema.staffNotes.subjectId, subjectId), inArray(schema.staffNotes.visibility, readableVisibilities(viewer))))
    .orderBy(desc(schema.staffNotes.createdAt));
}

export type NoteEntry = Awaited<ReturnType<typeof notesFor>>[number];

/** Le recruteur supprime ses propres notes ; le staff peut supprimer toutes celles qu'il voit. */
export function canDeleteNote(note: Pick<NoteEntry, "authorId">, viewer: Pick<User, "id" | "rank">) {
  return hasRank(viewer, "staff") || note.authorId === viewer.id;
}
