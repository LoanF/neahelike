"use client";

import Link from "next/link";
import { useState } from "react";
import { cx, DotsRow, Pin, Plaque, Rivet, Scene, Selection } from "@/components/plaque";
import { CREATURE_AVAILABILITY } from "@/content/availability";
import { CREATURES } from "@/content/lore";
import styles from "./home.module.css";

const ROW = 58; // 46 px de bouton + 12 px d'écart

/** Bestiaire de l'accueil : une lamelle dorée glisse vers la créature choisie, la fiche change en fondu. */
export function CreaturesShowcase() {
  const [index, setIndex] = useState(0);
  const current = CREATURES[index];
  const open = CREATURE_AVAILABILITY[current.id];

  return (
    <div className={styles.creatures}>
      <Plaque className={styles.creatureList}>
        <DotsRow className={styles.creatureDots} />
        <div className={styles.creatureButtons} role="tablist" aria-label="Créatures">
          <Selection className={styles.band} style={{ transform: `translateY(${index * ROW}px)` }} />
          {CREATURES.map((creature, i) => {
            const available = CREATURE_AVAILABILITY[creature.id];
            const selected = i === index;
            return (
              <button
                key={creature.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="nh-creature-card"
                className={cx(styles.creatureButton, selected && styles.creatureCurrent)}
                onClick={() => setIndex(i)}
              >
                {creature.name}
                <span className={styles.creaturePlaces}>
                  {available ? "Ouvertes" : "Closes"}
                  <Pin on={available} />
                </span>
              </button>
            );
          })}
        </div>
      </Plaque>

      <Plaque rivets="none" id="nh-creature-card" role="tabpanel" className={styles.creatureCard}>
        <Scene key={current.id} className={styles.creatureArt} caption={`Illustration : ${current.art}`} />
        <div key={`${current.id}-text`} className={styles.creatureBody}>
          <Rivet side="right" />
          <h3 className={styles.creatureName}>{current.name}</h3>
          <p className={styles.creatureText}>{current.origin}</p>
          <div className={styles.tiles}>
            <div className={styles.tile}><span>Origine</span><strong>{current.originShort}</strong></div>
            <div className={styles.tile}><span>Force</span><strong>{current.strengthShort}</strong></div>
            <div className={styles.tile}><span>Faiblesse</span><strong>{current.weaknessShort}</strong></div>
          </div>
          <div className={styles.creatureFoot}>
            <span>{open ? "Places ouvertes à la candidature" : "Places closes pour le moment"}</span>
            <Link href={`/lore#creatures-${current.id}`}>Lire la fiche</Link>
          </div>
        </div>
      </Plaque>
    </div>
  );
}
