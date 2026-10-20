"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, PinCheckbox } from "@/components/plaque";
import { acceptCgu } from "../actions";
import styles from "../portal.module.css";

function Submit({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className={styles.submit} disabled={!ready} loading={pending}>
      Accéder au portail
    </Button>
  );
}

/** Case CGU : le bouton reste éteint tant qu'elle n'est pas cochée. */
export function LiaisonForm() {
  const [accepted, setAccepted] = useState(false);
  return (
    <form action={acceptCgu} className={styles.form}>
      <PinCheckbox name="cgu" className={styles.check} checked={accepted} onChange={event => setAccepted(event.target.checked)}>
        J&apos;accepte les <Link href="/cgu" target="_blank">conditions générales d&apos;utilisation</Link>
      </PinCheckbox>
      <Submit ready={accepted} />
    </form>
  );
}
