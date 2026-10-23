import { ArrowDown, ArrowUp } from "lucide-react";
import type { Metadata } from "next";
import { DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { getCriteria } from "@/lib/criteria";
import { requireUser } from "@/lib/session";
import styles from "../admin.module.css";
import { moveCriterionAction, toggleCriterionAction } from "./actions";
import { CriterionForm } from "./criterion-form";

export const metadata: Metadata = { title: "Critères de refus" };

export default async function CriteresPage() {
  await requireUser({ rank: "admin" });
  const criteria = await getCriteria(true);

  return (
    <>
      <PortalHeader eyebrow="Administration" title="Critères de refus">
        Les raisons proposées quand l&apos;équipe refuse une candidature. Le joueur les reçoit en message privé. Un critère désactivé n&apos;est plus proposé, mais reste lisible
        dans les anciens refus.
      </PortalHeader>
      <div className={styles.page}>
        <Plaque className={styles.panel}>
          <DotsRow className={styles.dots} />
          <h2 className={styles.title}>Critères</h2>
          <ul className={styles.rows}>
            {criteria.map((item, index) => (
              <li key={item.id} className={styles.factionRow}>
                <span className={styles.factionName}>
                  <strong>{item.label}</strong>
                </span>
                <span className={styles.factionControls}>
                  <form action={toggleCriterionAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="value" value={String(!item.active)} />
                    <button type="submit" className={styles.switch} aria-pressed={item.active} title="Cliquer pour changer">
                      <span className={styles.switchTrack} aria-hidden="true">
                        <span className={styles.switchThumb} />
                      </span>
                      {item.active ? "Proposé" : "Désactivé"}
                    </button>
                  </form>
                  <form className={styles.inlineForm}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" formAction={moveCriterionAction.bind(null, "up")} className={styles.iconButton} disabled={index === 0} aria-label={`Monter ${item.label}`}>
                      <ArrowUp size={16} aria-hidden="true" />
                    </button>
                    <button type="submit" formAction={moveCriterionAction.bind(null, "down")} className={styles.iconButton} disabled={index === criteria.length - 1} aria-label={`Descendre ${item.label}`}>
                      <ArrowDown size={16} aria-hidden="true" />
                    </button>
                  </form>
                </span>
                <details className={styles.editSlot}>
                  <summary className={styles.textButton}>Renommer</summary>
                  <div className={styles.editBox}>
                    <CriterionForm id={item.id} label={item.label} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Plaque>
        <Plaque className={styles.panel}>
          <h2 className={styles.title}>Ajouter un critère</h2>
          <CriterionForm />
        </Plaque>
      </div>
    </>
  );
}
