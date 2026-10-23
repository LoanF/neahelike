import "server-only";
import { asc, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getFactions } from "./factions";
import { displayNameSql } from "./team";

const WEEKS = 12;
const DECISIONS = ["candidature.validee", "candidature.modification", "candidature.refusee"];

/** Lundi 00:00 (heure de Paris approximée en UTC) de la semaine d'une date. */
function weekStart(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start;
}

/** Chiffres du tableau de bord des admins, calculés à la demande. */
export async function getStats() {
  const [applications, events, users, { affinities, creatures }] = await Promise.all([
    db().select().from(schema.applications),
    db()
      .select({ type: schema.events.type, subjectId: schema.events.subjectId, actorId: schema.events.actorId, createdAt: schema.events.createdAt })
      .from(schema.events)
      .where(inArray(schema.events.type, ["candidature.envoyee", ...DECISIONS, "entretien.valide"]))
      .orderBy(asc(schema.events.createdAt)),
    db()
      .select({ id: schema.users.id, name: displayNameSql(schema.users), rank: schema.users.rank })
      .from(schema.users),
    getFactions(true),
  ]);

  const submitted = applications.filter(item => item.submittedAt);
  const byStatus = (status: string) => applications.filter(item => item.status === status).length;
  const accepted = byStatus("entretien") + byStatus("whitelistee");
  const refused = byStatus("refusee");

  // Délai de traitement : entre chaque envoi et la décision suivante de l'équipe sur ce joueur.
  const delays: number[] = [];
  const pending = new Map<string, Date>();
  for (const event of events) {
    if (!event.subjectId) continue;
    if (event.type === "candidature.envoyee") pending.set(event.subjectId, event.createdAt);
    else if (DECISIONS.includes(event.type) && pending.has(event.subjectId)) {
      delays.push(event.createdAt.getTime() - pending.get(event.subjectId)!.getTime());
      pending.delete(event.subjectId);
    }
  }
  const averageHours = delays.length ? delays.reduce((sum, value) => sum + value, 0) / delays.length / 3_600_000 : null;

  // Candidatures envoyées par semaine (premiers envois et renvois après modification).
  const thisWeek = weekStart(new Date());
  const weeks = Array.from({ length: WEEKS }, (_, index) => {
    const start = new Date(thisWeek);
    start.setUTCDate(start.getUTCDate() - (WEEKS - 1 - index) * 7);
    return { start, count: 0 };
  });
  for (const event of events) {
    if (event.type !== "candidature.envoyee") continue;
    const week = weeks.find(item => item.start.getTime() === weekStart(event.createdAt).getTime());
    if (week) week.count += 1;
  }

  // Répartition des personnages, sur les candidatures envoyées.
  const count = (key: "affinity" | "creature", id: string) => submitted.filter(item => item.rp?.[key] === id).length;
  const affinityShare = [...affinities.map(item => ({ label: item.name, value: count("affinity", item.id) })), { label: "Aucune affinité", value: count("affinity", "") }];
  const creatureShare = [...creatures.map(item => ({ label: item.name, value: count("creature", item.id) })), { label: "Humain", value: count("creature", "") }];

  // Décisions prises par chaque membre de l'équipe.
  const names = new Map(users.map(user => [user.id, user.name]));
  const perMember = new Map<string, number>();
  for (const event of events) {
    if (!event.actorId || !(DECISIONS.includes(event.type) || event.type === "entretien.valide")) continue;
    perMember.set(event.actorId, (perMember.get(event.actorId) ?? 0) + 1);
  }
  const team = [...perMember.entries()].map(([id, value]) => ({ label: names.get(id) ?? "Ancien membre", value })).sort((a, b) => b.value - a.value);

  return {
    totals: {
      accounts: users.length,
      submitted: submitted.length,
      toRead: byStatus("envoyee"),
      interviews: byStatus("entretien"),
      whitelisted: byStatus("whitelistee"),
      validationRate: accepted + refused ? accepted / (accepted + refused) : null,
      averageHours,
    },
    weeks: weeks.map(week => ({ start: week.start, count: week.count })),
    affinityShare,
    creatureShare,
    team,
  };
}
