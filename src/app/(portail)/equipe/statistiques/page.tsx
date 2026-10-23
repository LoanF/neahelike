import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { requireUser } from "@/lib/session";
import { getStats } from "@/lib/stats";
import styles from "./stats.module.css";

export const metadata: Metadata = { title: "Statistiques" };

const weekLabel = (date: Date) => date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

function duration(hours: number | null) {
  if (hours === null) return "—";
  if (hours < 1) return "< 1 h";
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} j`;
}

/** Barres horizontales : une seule teinte, la valeur écrite à côté (jamais la couleur seule). */
function Bars({ title, rows, empty }: { title: string; rows: { label: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map(row => row.value));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return (
    <Plaque rivets="none" className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {total === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <ul className={styles.bars}>
          {rows.map(row => (
            <li key={row.label} className={styles.barRow}>
              <span className={styles.barLabel}>{row.label}</span>
              <span className={styles.barTrack}>
                <span className={styles.barFill} style={{ width: `${(row.value / max) * 100}%` }} />
              </span>
              <span className={styles.barValue}>
                {row.value}
                <span className={styles.barShare}> · {Math.round((row.value / total) * 100)} %</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Plaque>
  );
}

export default async function StatistiquesPage() {
  await requireUser({ rank: "admin" });
  const { totals, weeks, affinityShare, creatureShare, team } = await getStats();
  const maxWeek = Math.max(1, ...weeks.map(week => week.count));

  const tiles = [
    { label: "Whitelist sur le serveur", value: String(totals.whitelisted), note: "Joueurs whitelist aujourd'hui", highlight: true },
    { label: "Candidatures envoyées", value: String(totals.submitted), note: `${totals.accounts} comptes liés` },
    { label: "À lire", value: String(totals.toRead), note: "Envoyées, sans décision" },
    { label: "Entretiens à passer", value: String(totals.interviews), note: "Écrit validé, en attente de l'entretien vocal" },
    { label: "Taux de validation", value: totals.validationRate === null ? "—" : `${Math.round(totals.validationRate * 100)} %`, note: "Écrits validés sur décisions finales" },
    { label: "Délai de traitement", value: duration(totals.averageHours), note: "En moyenne, de l'envoi à la décision" },
  ];

  return (
    <>
      <PortalHeader eyebrow="Administration" title="Statistiques">
        Les candidatures, leur traitement et la répartition des personnages.
      </PortalHeader>
      <div className={styles.page}>
        <ul className={styles.tiles}>
          {tiles.map(tile => (
            <li key={tile.label}>
              <Plaque rivets="none" className={"highlight" in tile ? `${styles.tile} ${styles.tileHighlight}` : styles.tile}>
                <span className={styles.tileLabel}>{tile.label}</span>
                <span className={styles.tileValue}>{tile.value}</span>
                <span className={styles.tileNote}>{tile.note}</span>
              </Plaque>
            </li>
          ))}
        </ul>

        <Plaque className={styles.card}>
          <DotsRow className={styles.dots} />
          <h2 className={styles.cardTitle}>Candidatures envoyées par semaine</h2>
          <div className={styles.chart} role="img" aria-label="Candidatures envoyées par semaine, sur les 12 dernières semaines (détail dans le tableau ci-dessous)">
            {weeks.map((week, index) => (
              <div key={week.start.toISOString()} className={styles.column} style={{ "--h": `${(week.count / maxWeek) * 100}%` } as CSSProperties}>
                <span className={styles.columnBar} />
                <span className={styles.tooltip}>
                  Semaine du {weekLabel(week.start)} : <strong>{week.count}</strong>
                </span>
                <span className={styles.columnLabel}>{index % 2 === 1 || index === weeks.length - 1 ? weekLabel(week.start) : ""}</span>
              </div>
            ))}
          </div>
          <table className={styles.srOnly}>
            <caption>Candidatures envoyées par semaine</caption>
            <thead>
              <tr>
                <th>Semaine du</th>
                <th>Candidatures</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map(week => (
                <tr key={week.start.toISOString()}>
                  <td>{weekLabel(week.start)}</td>
                  <td>{week.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Plaque>

        <div className={styles.split}>
          <Bars title="Affinités choisies" rows={affinityShare} empty="Aucune candidature envoyée pour l'instant." />
          <Bars title="Créatures choisies" rows={creatureShare} empty="Aucune candidature envoyée pour l'instant." />
        </div>
        <Bars title="Décisions par membre de l'équipe" rows={team} empty="Aucune décision prise pour l'instant." />
      </div>
    </>
  );
}
