"use client";

import { useEffect, useState } from "react";
import { Button, cx, PinCheckbox, TextAreaField, TextField } from "@/components/plaque";
import type { EmblemName } from "@/components/site/emblem";
import { Emblem, EMBLEM_NAMES } from "@/components/site/emblem";
import { useActionForm } from "@/components/use-action-form";
import type { FactionKind } from "@/db/schema";
import type { FactionFormState } from "./actions";
import { saveFactionAction } from "./actions";
import styles from "../admin.module.css";

export interface LoreField {
  key: string;
  label: string;
  long?: boolean;
  max: number;
}

interface FactionFormProps {
  /** Création : pas d'id, choix du type. Modification : id et valeurs actuelles. */
  id?: string;
  kind?: FactionKind;
  initial?: Record<string, string | boolean>;
  fields: Record<FactionKind, LoreField[]>;
  onDone?: () => void;
}

function Submit({ label, pending }: { label: string; pending: boolean }) {
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

/** Formulaire du lore d'une affinité ou d'une créature : tous les champs sont obligatoires. */
export function FactionForm({ id, kind: fixedKind, initial = {}, fields, onDone }: FactionFormProps) {
  const [state, onSubmit, pending] = useActionForm<FactionFormState>(saveFactionAction, null);
  const [kind, setKind] = useState<FactionKind>(fixedKind ?? "affinite");
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initial).filter(([, value]) => typeof value === "string")) as Record<string, string>,
  );
  const [emblem, setEmblem] = useState<string>(typeof initial.emblem === "string" ? initial.emblem : "");
  const [divine, setDivine] = useState(initial.divine !== false);

  useEffect(() => {
    if (state && "ok" in state) {
      if (!id) {
        setValues({});
        setEmblem("");
      }
      onDone?.();
    }
  }, [state, id, onDone]);

  const set = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));

  return (
    <form onSubmit={onSubmit} className={styles.stack}>
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="emblem" value={emblem} />

      {!fixedKind && (
        <fieldset className={styles.segmented}>
          <legend className={styles.srOnly}>Type</legend>
          {(["affinite", "creature"] as const).map(option => (
            <label key={option} className={cx(styles.segment, kind === option && styles.segmentOn)}>
              <input type="radio" name="kindChoice" value={option} checked={kind === option} onChange={() => setKind(option)} />
              {option === "affinite" ? "Affinité" : "Créature"}
            </label>
          ))}
        </fieldset>
      )}

      <TextField name="name" label="Nom" required maxLength={40} value={values.name ?? ""} onChange={event => set("name", event.target.value)} />

      <fieldset className={styles.emblems}>
        <legend>Emblème</legend>
        <div className={styles.emblemGrid}>
          {EMBLEM_NAMES.map(name => (
            <button
              key={name}
              type="button"
              className={cx(styles.emblemChoice, emblem === name && styles.emblemOn)}
              aria-pressed={emblem === name}
              aria-label={name}
              onClick={() => setEmblem(name)}
            >
              <Emblem name={name as EmblemName} size={26} />
            </button>
          ))}
        </div>
      </fieldset>

      <div className={styles.fieldGrid}>
        {fields[kind].map(field =>
          field.long ? (
            <TextAreaField
              key={field.key}
              name={field.key}
              label={field.label}
              required
              maxLength={field.max}
              value={values[field.key] ?? ""}
              onChange={event => set(field.key, event.target.value)}
              className={styles.wide}
            />
          ) : (
            <TextField key={field.key} name={field.key} label={field.label} required maxLength={field.max} value={values[field.key] ?? ""} onChange={event => set(field.key, event.target.value)} />
          ),
        )}
      </div>

      {kind === "affinite" && (
        <PinCheckbox name="divine" checked={divine} onChange={event => setDivine(event.target.checked)}>
          Affinité divine (avec un dieu et un pouvoir)
        </PinCheckbox>
      )}

      {state && "error" in state && <p className={styles.error} role="alert">{state.error}</p>}
      {state && "ok" in state && !id && <p className={styles.success} role="status">Ajoutée : elle apparaît sur le site et dans la candidature.</p>}
      <div>
        <Submit pending={pending} label={id ? "Enregistrer" : "Ajouter"} />
      </div>
    </form>
  );
}
