import type { Metadata } from "next";
import Link from "next/link";
import { cx, DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { Timeline } from "@/components/equipe/timeline";
import { criteriaLabels } from "@/lib/criteria";
import { requireUser } from "@/lib/session";
import type { JournalFilter } from "@/lib/team";
import { journal, journalActors, JOURNAL_FILTERS } from "@/lib/team";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Journal" };

const FILTER_LABEL: Record<JournalFilter, string> = {
  candidatures: "Candidatures",
  decisions: "Décisions",
  comptes: "Comptes",
  notes: "Notes",
  administration: "Administration",
  wipes: "Wipes",
};

const PERIODS = [
  { id: "7", label: "7 jours" },
  { id: "30", label: "30 jours" },
  { id: "", label: "Tout" },
];

type Params = { type?: string; membre?: string; periode?: string; page?: string };

export default async function JournalPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser({ rank: "admin" });
  const params = await searchParams;
  const filter = params.type && params.type in JOURNAL_FILTERS ? (params.type as JournalFilter) : undefined;
  const actorId = params.membre && /^\d+$/.test(params.membre) ? params.membre : undefined;
  const days = params.periode === "7" || params.periode === "30" ? Number(params.periode) : undefined;
  const page = Math.max(0, Number.parseInt(params.page ?? "0", 10) || 0);

  const [{ entries, hasMore }, actors, criteria] = await Promise.all([journal({ filter, actorId, days, page }), journalActors(), criteriaLabels()]);

  /** Lien qui garde les autres filtres. */
  const href = (change: Partial<Params>) => {
    const next = { type: filter, membre: actorId, periode: days ? String(days) : undefined, page: undefined as string | undefined, ...change };
    const query = Object.entries(next)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&");
    return `/equipe/journal${query ? `?${query}` : ""}`;
  };

  return (
    <>
      <PortalHeader eyebrow="Administration" title="Journal">
        Tout ce qui se passe sur le portail : les étapes des joueurs, les décisions de l&apos;équipe et les changements d&apos;administration.
      </PortalHeader>
      <div className={styles.page}>
        <Plaque className={styles.panel}>
          <DotsRow className={styles.dots} />
          <div className={styles.filters}>
            <nav className={styles.chips} aria-label="Type d'événement">
              <Link href={href({ type: undefined })} className={cx(styles.chip, !filter && styles.chipOn)}>
                Tout
              </Link>
              {(Object.keys(FILTER_LABEL) as JournalFilter[]).map(id => (
                <Link key={id} href={href({ type: id })} className={cx(styles.chip, filter === id && styles.chipOn)}>
                  {FILTER_LABEL[id]}
                </Link>
              ))}
            </nav>
            <nav className={styles.chips} aria-label="Période">
              {PERIODS.map(period => (
                <Link key={period.id} href={href({ periode: period.id || undefined })} className={cx(styles.chip, (days ? String(days) : "") === period.id && styles.chipOn)}>
                  {period.label}
                </Link>
              ))}
            </nav>
            {actors.length > 0 && (
              <nav className={styles.chips} aria-label="Membre de l'équipe">
                <Link href={href({ membre: undefined })} className={cx(styles.chip, !actorId && styles.chipOn)}>
                  Toute l&apos;équipe
                </Link>
                {actors.map(member => (
                  <Link key={member.id} href={href({ membre: member.id })} className={cx(styles.chip, actorId === member.id && styles.chipOn)}>
                    {member.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <Timeline entries={entries} criteria={criteria} showSubject />
          <div className={styles.pager}>
            {page > 0 ? <Link href={href({ page: String(page - 1) })}>← Plus récents</Link> : <span />}
            {hasMore && <Link href={href({ page: String(page + 1) })}>Plus anciens →</Link>}
          </div>
        </Plaque>
      </div>
    </>
  );
}
