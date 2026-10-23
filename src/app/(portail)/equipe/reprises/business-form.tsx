"use client";

import { useEffect, useState } from "react";
import { Button, TextAreaField, TextField } from "@/components/plaque";
import { useActionForm } from "@/components/use-action-form";
import type { BusinessFormState } from "./actions";
import { saveBusinessAction } from "./actions";
import styles from "../admin.module.css";

function Submit({ label, pending }: { label: string; pending: boolean }) {
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

/** Ajout ou modification d'une entreprise à reprendre. */
export function BusinessForm({ id, name = "", description = "" }: { id?: string; name?: string; description?: string }) {
  const [state, onSubmit, pending] = useActionForm<BusinessFormState>(saveBusinessAction, null);
  const [values, setValues] = useState({ name, description });

  useEffect(() => {
    if (state && "ok" in state && !id) setValues({ name: "", description: "" });
  }, [state, id]);

  return (
    <form onSubmit={onSubmit} className={styles.stack}>
      {id && <input type="hidden" name="id" value={id} />}
      <TextField name="name" label="Nom" required maxLength={60} placeholder="La forge du port" value={values.name} onChange={event => setValues(v => ({ ...v, name: event.target.value }))} />
      <TextAreaField
        name="description"
        label="Description courte"
        maxLength={200}
        placeholder="Ce que fait l'entreprise, où elle se trouve."
        value={values.description}
        onChange={event => setValues(v => ({ ...v, description: event.target.value }))}
      />
      {state && "error" in state && <p className={styles.error} role="alert">{state.error}</p>}
      {state && "ok" in state && <p className={styles.success} role="status">{id ? "Enregistré." : "Ajoutée : elle apparaît dans le dossier de reprise."}</p>}
      <div>
        <Submit pending={pending} label={id ? "Enregistrer" : "Ajouter"} />
      </div>
    </form>
  );
}
