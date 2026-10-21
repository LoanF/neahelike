"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, PinCheckbox } from "@/components/plaque";
import { sendCandidature } from "../actions";
import styles from "../candidature.module.css";

function Submit({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={!ready} loading={pending}>
      Envoyer ma candidature
    </Button>
  );
}

/** Certification et envoi final. */
export function SendForm() {
  const [certified, setCertified] = useState(false);
  return (
    <form action={sendCandidature} className={styles.send}>
      <PinCheckbox name="certify" checked={certified} onChange={event => setCertified(event.target.checked)}>
        Je certifie que ces informations sont exactes et que j&apos;ai lu le règlement du serveur.
        <span className={styles.checkHint}>Une fois envoyée, ta candidature ne peut plus être modifiée, sauf si l&apos;équipe te le demande.</span>
      </PinCheckbox>
      <Submit ready={certified} />
    </form>
  );
}
