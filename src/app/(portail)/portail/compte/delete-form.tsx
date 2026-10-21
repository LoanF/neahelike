"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, PinCheckbox, TextField } from "@/components/plaque";
import { deleteAccount } from "../../actions";
import styles from "./compte.module.css";

function Submit({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" disabled={!ready} loading={pending}>
      Supprimer mon compte
    </Button>
  );
}

/** Double confirmation : case « je comprends » et mot à recopier. */
export function DeleteForm() {
  const [understood, setUnderstood] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const ready = understood && confirmation.trim().toUpperCase() === "SUPPRIMER";
  return (
    <form action={deleteAccount} className={styles.deleteForm}>
      <PinCheckbox name="understood" checked={understood} onChange={event => setUnderstood(event.target.checked)}>
        Je comprends que ma candidature, mon dossier et mon historique sur le portail seront effacés définitivement.
      </PinCheckbox>
      <TextField
        name="confirmation"
        label="Recopie SUPPRIMER pour confirmer"
        autoComplete="off"
        value={confirmation}
        onChange={event => setConfirmation(event.target.value)}
      />
      <div>
        <Submit ready={ready} />
      </div>
    </form>
  );
}
