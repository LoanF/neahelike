"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import type { CSSProperties } from "react";
import { cx, DotsRow, Plaque, Selection } from "@/components/plaque";
import type { EmblemName } from "@/components/site/emblem";
import { Emblem } from "@/components/site/emblem";
import styles from "./dossier.module.css";

export interface TakeoverItem {
  id: string;
  name: string;
  meta: string;
  emblem: EmblemName;
  available: boolean;
}

export interface TakeoverSection {
  id: "entreprise" | "affinite" | "creature";
  label: string;
  emblem: EmblemName;
  intro: string;
  items: TakeoverItem[];
  /** Texte quand la liste est vide. */
  empty: string;
}

/**
 * Présentation de tout ce qui peut être repris : trois grandes plaques, et la grille de la catégorie choisie.
 * Chaque carte porte un badge « Disponible », ou le sceau « Repris ».
 */
export function TakeoverExplorer({ sections }: { sections: TakeoverSection[] }) {
  const [current, setCurrent] = useState(sections[0].id);
  const section = sections.find(item => item.id === current) ?? sections[0];

  return (
    <div className={styles.explorer}>
      <div className={styles.categories} role="tablist" aria-label="Ce qui peut être repris">
        {sections.map(item => {
          const available = item.items.filter(entry => entry.available).length;
          const selected = item.id === current;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`reprise-tab-${item.id}`}
              aria-selected={selected}
              aria-controls="reprise-panel"
              className={cx(styles.category, selected && styles.categoryOn)}
              onClick={() => setCurrent(item.id)}
            >
              {selected && <Selection className={styles.categoryBand} />}
              <span className={styles.categorySocket}>
                <Emblem name={item.emblem} size={34} />
              </span>
              <span className={styles.categoryLabel}>{item.label}</span>
              <span className={styles.categoryCount}>
                {item.items.length === 0 ? "À proposer" : `${available} disponible${available > 1 ? "s" : ""} sur ${item.items.length}`}
              </span>
            </button>
          );
        })}
      </div>

      <Plaque key={section.id} id="reprise-panel" role="tabpanel" aria-labelledby={`reprise-tab-${section.id}`} className={styles.panel}>
        <DotsRow className={styles.dots} />
        <p className={styles.intro}>{section.intro}</p>
        {section.items.length === 0 ? (
          <p className={styles.empty}>{section.empty}</p>
        ) : (
          <ul className={styles.grid}>
            {section.items.map((item, index) => (
              <li key={item.id} className={cx(styles.card, !item.available && styles.cardTaken)} style={{ "--i": index } as CSSProperties}>
                <span className={styles.cardSocket}>
                  <Emblem name={item.emblem} size={30} />
                </span>
                <span className={styles.cardName}>{item.name}</span>
                {item.meta && <span className={styles.cardMeta}>{item.meta}</span>}
                {item.available ? (
                  <span className={styles.available}>
                    <Check size={13} aria-hidden="true" /> Disponible
                  </span>
                ) : (
                  <span className={styles.seal} aria-label="Déjà repris">
                    Repris
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Plaque>
    </div>
  );
}
