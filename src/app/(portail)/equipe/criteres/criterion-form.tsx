"use client";

import { useEffect, useState } from "react";
import { Button, TextField } from "@/components/plaque";
import { useActionForm } from "@/components/use-action-form";
import type { CriterionFormState } from "./actions";
import { saveCriterionAction } from "./actions";
import styles from "../admin.module.css";

function Submit({ label, pending }: { label: string; pending: boolean }) {
  return (
    <Button type="submit" size="sm" loading={pending}>
      {label}
    </Button>
  );
}

/** Ajout d'un critère, ou renommage (le changement s'applique aussi aux anciens refus). */
export function CriterionForm({ id, label = "" }: { id?: string; label?: string }) {
  const [state, onSubmit, pending] = useActionForm<CriterionFormState>(saveCriterionAction, null);
  const [value, setValue] = useState(label);

  useEffect(() => {
    if (state && "ok" in state && !id) setValue("");
  }, [state, id]);

  return (
    <form onSubmit={onSubmit} className={styles.inline}>
      {id && <input type="hidden" name="id" value={id} />}
      <TextField
        name="label"
        label={id ? "Nouveau libellé" : "Nouveau critère"}
        maxLength={80}
        value={value}
        onChange={event => setValue(event.target.value)}
        error={state && "error" in state ? state.error : undefined}
        hint={state && "ok" in state ? "Enregistré." : undefined}
      />
      <Submit pending={pending} label={id ? "Renommer" : "Ajouter"} />
    </form>
  );
}
