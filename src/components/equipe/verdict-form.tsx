"use client";

import { useState } from "react";
import { Button, TextAreaField } from "@/components/plaque";
import { useActionForm } from "@/components/use-action-form";
import styles from "./verdict-form.module.css";

export type VerdictState = ({ ok: true; warnings: string[] } | { error: string }) & { at: number };

interface VerdictFormProps {
  /** Action serveur : reçoit `id`, `verdict` (« accepter » ou « refuser ») et `comment`. */
  action: (previous: VerdictState | null, data: FormData) => Promise<VerdictState | null>;
  id: string;
  acceptLabel: string;
  refuseLabel: string;
  /** Rappel affiché sous le message (obligatoire pour un refus, envoyé au joueur). */
  hint: string;
  /** Demande encore à décider. Une fois décidée (page rafraîchie), seule la confirmation reste affichée. */
  active?: boolean;
}

/** Accepter ou refuser une demande (dossier de reprise, wipe), avec un message au joueur. */
export function VerdictForm({ action, id, acceptLabel, refuseLabel, hint, active = true }: VerdictFormProps) {
  const [state, onSubmit, pending] = useActionForm<VerdictState | null>(action, null);
  const [comment, setComment] = useState("");

  if (state && "ok" in state) {
    return (
      <div className={styles.success} role="status">
        Décision enregistrée.
        {state.warnings.length > 0 && (
          <ul>
            {state.warnings.map(warning => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (!active) return null;

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <input type="hidden" name="id" value={id} />
      <TextAreaField name="comment" label="Message au joueur" maxLength={1000} value={comment} onChange={event => setComment(event.target.value)} hint={hint} />
      {state && "error" in state && <p className={styles.error} role="alert">{state.error}</p>}
      <div className={styles.actions}>
        <Button type="submit" name="verdict" value="refuser" variant="danger" disabled={pending}>
          {refuseLabel}
        </Button>
        <Button type="submit" name="verdict" value="accepter" loading={pending}>
          {acceptLabel}
        </Button>
      </div>
    </form>
  );
}
