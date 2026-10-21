"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, TextField } from "@/components/plaque";
import type { DeleteAccountState } from "../../actions";
import { deleteAccountAction } from "../../actions";
import styles from "./fiche.module.css";

function Submit({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" disabled={!ready} loading={pending}>
      Supprimer le compte
    </Button>
  );
}

/** Staff : suppression du compte à la demande du joueur (ticket Discord). */
export function DeleteAccount({ subjectId }: { subjectId: string }) {
  const [state, action] = useActionState<DeleteAccountState, FormData>(deleteAccountAction, null);
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
    <form action={action} className={styles.confirm}>
      <input type="hidden" name="subjectId" value={subjectId} />
      <p className={styles.confirmText}>
        À faire seulement sur demande du joueur (ticket Discord). Compte, candidature, notes et notifications sont effacés définitivement. Après un refus de moins de
        3 mois, seuls son ID Discord et la fin du délai sont gardés pour qu&apos;il ne puisse pas recandidater plus tôt.
      </p>
      <TextField name="confirmation" label="Recopie SUPPRIMER pour confirmer" autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} error={state?.error} />
      <div className={styles.confirmActions}>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
        <Submit ready={confirmation.trim().toUpperCase() === "SUPPRIMER"} />
      </div>
    </form>
  );
}
