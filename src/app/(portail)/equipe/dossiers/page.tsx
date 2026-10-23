import type { Metadata } from "next";
import { TakeoverCard } from "@/components/equipe/takeover-card";
import { DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { takeoverNames } from "@/lib/businesses";
import { hasRank, requireUser } from "@/lib/session";
import { pendingDossiers } from "@/lib/takeovers";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Dossiers de reprise" };

/** Dossiers de reprise déposés à part (après une candidature sans dossier), en attente de lecture. */
export default async function DossiersPage() {
  const viewer = await requireUser({ rank: "recruteur" });
  const [rows, names] = await Promise.all([pendingDossiers(), takeoverNames()]);

  return (
    <>
      <PortalHeader eyebrow="Équipe" title="Dossiers de reprise">
        Les dossiers déposés à part, par des joueurs dont la candidature est partie sans dossier. Accepte-les ou refuse-les : le joueur est prévenu en privé.
      </PortalHeader>
      <div className={styles.page}>
        <Plaque className={styles.panel}>
          <DotsRow className={styles.dots} />
          <h2 className={styles.title}>À lire ({rows.length})</h2>
          {rows.length === 0 ? (
            <p className={styles.text}>Aucun dossier en attente.</p>
          ) : (
            <div className={styles.stack}>
              {rows.map(({ dossier, user }) => (
                <TakeoverCard key={dossier.id} dossier={dossier} names={names} player={user} canDecide={user.id !== viewer.id || hasRank(viewer, "owner")} />
              ))}
            </div>
          )}
        </Plaque>
      </div>
    </>
  );
}
