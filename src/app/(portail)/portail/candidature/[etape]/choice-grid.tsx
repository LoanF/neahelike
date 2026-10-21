"use client";

import { Badge, cx } from "@/components/plaque";
import type { EmblemName } from "@/components/site/emblem";
import { Emblem } from "@/components/site/emblem";
import { CLOSED_LABEL } from "@/content/candidature";
import styles from "../candidature.module.css";

export interface Choice {
  id: string;
  name: string;
  meta?: string;
  emblem?: EmblemName;
  closed?: boolean;
}

interface ChoiceGridProps {
  name: string;
  legend: string;
  hint?: string;
  choices: Choice[];
  value: string;
  onChange: (value: string) => void;
  /** Ajoute une option « Aucune » (valeur vide). */
  noneLabel?: string;
  error?: string;
}

/** Cartes radio : une seule option, les places closes sont grisées et non sélectionnables. */
export function ChoiceGrid({ name, legend, hint, choices, value, onChange, noneLabel, error }: ChoiceGridProps) {
  const options: Choice[] = noneLabel ? [{ id: "", name: noneLabel }, ...choices] : choices;
  return (
    <fieldset className={styles.choices} data-invalid={error ? "true" : undefined} tabIndex={error ? -1 : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      {hint && <p className={styles.choiceHint}>{hint}</p>}
      <div className={styles.choiceGrid}>
        {options.map(choice => {
          const selected = value === choice.id;
          // Une place fermée reste affichée cochée si le joueur l'avait choisie avant la fermeture.
          const disabled = choice.closed && !selected;
          return (
            <label key={choice.id || "none"} className={cx(styles.choice, selected && styles.choiceSelected, choice.closed && styles.choiceClosed)}>
              <input type="radio" name={name} value={choice.id} checked={selected} disabled={disabled} onChange={() => onChange(choice.id)} />
              {choice.emblem && <Emblem name={choice.emblem} size={28} className={styles.choiceEmblem} />}
              <span className={styles.choiceName}>{choice.name}</span>
              {choice.meta && <span className={styles.choiceMeta}>{choice.meta}</span>}
              {choice.closed && <Badge tone="danger" className={styles.closedBadge}>{CLOSED_LABEL}</Badge>}
            </label>
          );
        })}
      </div>
      {error && <p className={styles.fieldError} role="alert">{error}</p>}
    </fieldset>
  );
}
