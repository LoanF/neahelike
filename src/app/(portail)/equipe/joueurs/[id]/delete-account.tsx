"use client";

import { useState } from "react";
import { Button, TextField } from "@/components/plaque";
import { useActionForm } from "@/components/use-action-form";
import type { DeleteAccountState } from "../../actions";
import { deleteAccountAction } from "../../actions";
import styles from "./fiche.module.css";

function Submit({ ready, pending }: { ready: boolean; pending: boolean }) {
  return (
    <Button type="submit" variant="danger" disabled={!ready} loading={pending}>
      Supprimer le compte
    </Button>
  );
}

/** Admin : suppression du compte à la demande du joueur (ticket Discord). */
export function DeleteAccount({ subjectId }: { subjectId: string }) {
  const [state, onSubmit, pending] = useActionForm<DeleteAccountState>(deleteAccountAction, null);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  if (!open) {
    return (
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        Supprimer le compte…
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className={styles.confirm}>
      <input type="hidden" name="subjectId" value={subjectId} />
      <p className={styles.confirmText}>
        À faire seulement sur demande du joueur (ticket Discord). Compte, candidature, notes et notifications sont effacés définitivement. Sur Discord, il perd sa
        whitelist, retrouve le rôle Novice et reçoit un message privé. Après un refus de moins de 3 mois, seuls son ID Discord et la fin du délai sont gardés pour
        qu&apos;il ne puisse pas recandidater plus tôt.
      </p>
      <TextField name="confirmation" label="Recopie SUPPRIMER pour confirmer" autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} error={state?.error} />
      <div className={styles.confirmActions}>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
        <Submit pending={pending} ready={confirmation.trim().toUpperCase() === "SUPPRIMER"} />
      </div>
    </form>
  );
}
