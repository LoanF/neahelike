import { Archive, ArchiveRestore, ArrowDown, ArrowUp } from "lucide-react";
import type { Metadata } from "next";
import { DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { Emblem } from "@/components/site/emblem";
import { getBusinesses } from "@/lib/businesses";
import { requireUser } from "@/lib/session";
import styles from "../admin.module.css";
import { moveBusinessAction, toggleBusinessAction } from "./actions";
import { BusinessForm } from "./business-form";

export const metadata: Metadata = { title: "Entreprises" };

export default async function ReprisesPage() {
  await requireUser({ rank: "admin" });
  const all = await getBusinesses(true);
  const active = all.filter(item => !item.archived);
  const archived = all.filter(item => item.archived);

  return (
    <>
      <PortalHeader eyebrow="Administration" title="Entreprises">
        Les entreprises de la cité qu&apos;un joueur peut demander à reprendre avec un dossier. Une entreprise reprise reste visible, marquée « Déjà reprise ». Les leads
        d&apos;affinités et de créatures se gèrent dans « Affinités et créatures ».
      </PortalHeader>
      <div className={styles.page}>
        <Plaque className={styles.panel}>
          <DotsRow className={styles.dots} />
          <h2 className={styles.title}>Entreprises</h2>
          {active.length === 0 ? (
            <p className={styles.text}>Aucune entreprise pour l&apos;instant. Les joueurs peuvent quand même proposer une nouvelle entreprise dans leur dossier.</p>
          ) : (
            <ul className={styles.rows}>
              {active.map((item, index) => (
                <li key={item.id} className={styles.factionRow}>
                  <span className={styles.factionName}>
                    <Emblem name="coin" size={24} className={styles.factionEmblem} />
                    <span>
                      <strong>{item.name}</strong>
                      {item.description && <span className={styles.personId}>{item.description}</span>}
                    </span>
                  </span>
                  <span className={styles.factionControls}>
                    <form action={toggleBusinessAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="flag" value="open" />
                      <input type="hidden" name="value" value={String(!item.open)} />
                      <button type="submit" className={styles.switch} aria-pressed={item.open} title="Cliquer pour changer">
                        <span className={styles.switchTrack} aria-hidden="true">
                          <span className={styles.switchThumb} />
                        </span>
                        {item.open ? "Disponible" : "Déjà reprise"}
                      </button>
                    </form>
                    <form className={styles.inlineForm}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" formAction={moveBusinessAction.bind(null, "up")} className={styles.iconButton} disabled={index === 0} aria-label={`Monter ${item.name}`}>
                        <ArrowUp size={16} aria-hidden="true" />
                      </button>
                      <button type="submit" formAction={moveBusinessAction.bind(null, "down")} className={styles.iconButton} disabled={index === active.length - 1} aria-label={`Descendre ${item.name}`}>
                        <ArrowDown size={16} aria-hidden="true" />
                      </button>
                    </form>
                    <form action={toggleBusinessAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="flag" value="archived" />
                      <input type="hidden" name="value" value="true" />
                      <button type="submit" className={styles.iconButton} aria-label={`Archiver ${item.name}`} title="Archiver : masquée du dossier de reprise">
                        <Archive size={16} aria-hidden="true" />
                      </button>
                    </form>
                  </span>
                  <details className={styles.editSlot}>
                    <summary className={styles.textButton}>Modifier</summary>
                    <div className={styles.editBox}>
                      <BusinessForm id={item.id} name={item.name} description={item.description} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Plaque>
        <Plaque className={styles.panel}>
          <h2 className={styles.title}>Ajouter une entreprise</h2>
          <BusinessForm />
        </Plaque>
        {archived.length > 0 && (
          <Plaque className={styles.panel}>
            <h2 className={styles.title}>Archivées</h2>
            <ul className={styles.rows}>
              {archived.map(item => (
                <li key={item.id} className={styles.row}>
                  <span className={styles.factionName}>{item.name}</span>
                  <form action={toggleBusinessAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="flag" value="archived" />
                    <input type="hidden" name="value" value="false" />
                    <button type="submit" className={styles.textButton}>
                      <ArchiveRestore size={15} aria-hidden="true" /> Restaurer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </Plaque>
        )}
      </div>
    </>
  );
}
