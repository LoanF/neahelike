"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, TextField } from "@/components/plaque";
import type { CriterionFormState } from "./actions";
import { saveCriterionAction } from "./actions";
import styles from "../admin.module.css";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      {label}
    </Button>
  );
}

/** Ajout d'un critère, ou renommage (le changement s'applique aussi aux anciens refus). */
export function CriterionForm({ id, label = "" }: { id?: string; label?: string }) {
  const [state, action] = useActionState<CriterionFormState, FormData>(saveCriterionAction, null);
  const [value, setValue] = useState(label);

  useEffect(() => {
    if (state && "ok" in state && !id) setValue("");
  }, [state, id]);

  return (
    <form action={action} className={styles.inline}>
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
      <Submit label={id ? "Renommer" : "Ajouter"} />
    </form>
  );
}
