import { ArrowDown, ArrowUp, Archive, ArchiveRestore } from "lucide-react";
import type { Metadata } from "next";
import { Badge, DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { Emblem } from "@/components/site/emblem";
import type { AffinityView, CreatureView } from "@/lib/factions";
import { getFactions, LORE_FIELDS } from "@/lib/factions";
import { requireUser } from "@/lib/session";
import styles from "../admin.module.css";
import { moveFactionAction, toggleFactionAction } from "./actions";
import { EditFaction } from "./edit-faction";
import { FactionForm } from "./faction-form";

export const metadata: Metadata = { title: "Affinités et créatures" };

type Item = (AffinityView | CreatureView) & { tagline: string };

/** Interrupteur : un petit formulaire qui inverse un drapeau. */
function Toggle({ id, flag, on, labels }: { id: string; flag: "joinOpen" | "leadOpen"; on: boolean; labels: [string, string] }) {
  return (
    <form action={toggleFactionAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="flag" value={flag} />
      <input type="hidden" name="value" value={String(!on)} />
      <button type="submit" className={styles.switch} aria-pressed={on} title="Cliquer pour changer">
        <span className={styles.switchTrack} aria-hidden="true">
          <span className={styles.switchThumb} />
        </span>
        {on ? labels[0] : labels[1]}
      </button>
    </form>
  );
}

function Rows({ items, kindLabel }: { items: Item[]; kindLabel: string }) {
  const active = items.filter(item => !item.archived);
  return (
    <ul className={styles.rows}>
      {active.map((item, index) => (
        <li key={item.id} className={styles.factionRow}>
          <span className={styles.factionName}>
            <Emblem name={item.emblem} size={26} className={styles.factionEmblem} />
            <span>
              <strong>{item.name}</strong>
              <span className={styles.personId}>{item.tagline}</span>
            </span>
            {!item.builtin && <Badge tone="gold">Ajoutée</Badge>}
          </span>
          <span className={styles.factionControls}>
            <Toggle id={item.id} flag="joinOpen" on={item.joinOpen} labels={["Places ouvertes", "Places closes"]} />
            <Toggle id={item.id} flag="leadOpen" on={item.leadOpen} labels={["Lead disponible", "Lead repris"]} />
            <form action={moveFactionAction} className={styles.inlineForm}>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" name="direction" value="up" className={styles.iconButton} disabled={index === 0} aria-label={`Monter ${item.name}`}>
                <ArrowUp size={16} aria-hidden="true" />
              </button>
              <button type="submit" name="direction" value="down" className={styles.iconButton} disabled={index === active.length - 1} aria-label={`Descendre ${item.name}`}>
                <ArrowDown size={16} aria-hidden="true" />
              </button>
            </form>
            <form action={toggleFactionAction}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="flag" value="archived" />
              <input type="hidden" name="value" value="true" />
              <button type="submit" className={styles.iconButton} aria-label={`Archiver ${item.name}`} title={`Archiver : masquée du site et de la candidature (${kindLabel})`}>
                <Archive size={16} aria-hidden="true" />
              </button>
            </form>
          </span>
          {!item.builtin && <EditFaction id={item.id} kind={"god" in item ? "affinite" : "creature"} lore={loreOf(item)} fields={LORE_FIELDS} />}
        </li>
      ))}
    </ul>
  );
}

/** Valeurs actuelles d'une affinité ou créature ajoutée, pour pré-remplir la modification. */
function loreOf(item: Item): Record<string, string | boolean> {
  const kind = "god" in item ? "affinite" : "creature";
  const record = item as unknown as Record<string, string | boolean>;
  return Object.fromEntries(["name", "emblem", "divine", ...LORE_FIELDS[kind].map(field => field.key)].filter(key => key in record).map(key => [key, record[key]]));
}

export default async function FactionsPage() {
  await requireUser({ rank: "admin" });
  const { affinities, creatures } = await getFactions(true);
  const affinityItems: Item[] = affinities.map(item => ({ ...item, tagline: `${item.god} · ${item.element}` }));
  const creatureItems: Item[] = creatures.map(item => ({ ...item, tagline: item.originShort }));
  const archived = [...affinityItems, ...creatureItems].filter(item => item.archived);

  return (
    <>
      <PortalHeader eyebrow="Administration" title="Affinités et créatures">
        « Places » : rejoindre l&apos;affinité ou incarner la créature. « Lead » : la reprendre avec un dossier. Les changements s&apos;appliquent tout de suite au portail, et en
        quelques minutes au site public.
      </PortalHeader>
      <div className={styles.page}>
        <Plaque className={styles.panel}>
          <DotsRow className={styles.dots} />
          <h2 className={styles.title}>Affinités</h2>
          <Rows items={affinityItems} kindLabel="affinité" />
        </Plaque>
        <Plaque className={styles.panel}>
          <h2 className={styles.title}>Créatures mystiques</h2>
          <Rows items={creatureItems} kindLabel="créature" />
        </Plaque>
        <Plaque className={styles.panel}>
          <h2 className={styles.title}>Ajouter une affinité ou une créature</h2>
          <p className={styles.text}>Son lore s&apos;affichera sur le site public, avec les autres. Le lore des affinités et créatures d&apos;origine se modifie dans le code.</p>
          <FactionForm fields={LORE_FIELDS} />
        </Plaque>
        {archived.length > 0 && (
          <Plaque className={styles.panel}>
            <h2 className={styles.title}>Archivées</h2>
            <p className={styles.text}>Masquées du site et de la candidature, mais toujours lisibles dans les anciennes candidatures.</p>
            <ul className={styles.rows}>
              {archived.map(item => (
                <li key={item.id} className={styles.row}>
                  <span className={styles.factionName}>
                    <Emblem name={item.emblem} size={22} className={styles.factionEmblem} />
                    {item.name}
                  </span>
                  <form action={toggleFactionAction}>
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
