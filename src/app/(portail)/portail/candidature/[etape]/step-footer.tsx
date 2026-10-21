"use client";

import { Check, CloudOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/plaque";
import styles from "../candidature.module.css";
import type { StepForm } from "./use-step-form";

function SaveIndicator({ form }: { form: StepForm }) {
  if (form.save === "pending") {
    return (
      <span className={styles.save}>
        <LoaderCircle size={15} className={styles.spin} aria-hidden="true" /> Enregistrement…
      </span>
    );
  }
  if (form.save === "error") {
    return (
      <span className={`${styles.save} ${styles.saveError}`}>
        <CloudOff size={15} aria-hidden="true" /> Non enregistré, vérifie ta connexion
      </span>
    );
  }
  if (form.save === "saved" && form.savedAt) {
    return (
      <span className={styles.save}>
        <Check size={15} aria-hidden="true" /> Enregistré à {form.savedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </span>
    );
  }
  return <span className={styles.save}>Enregistrement automatique</span>;
}

/** Bas de chaque étape : retour, état de l'enregistrement, « Suivant ». */
export function StepFooter({ form, backHref, submitLabel = "Suivant" }: { form: StepForm; backHref?: string; submitLabel?: string }) {
  return (
    <div className={styles.footer}>
      {form.errors.form && <p className={styles.formError} role="alert">{form.errors.form}</p>}
      <div className={styles.footerRow}>
        {backHref ? (
          <Button type="button" variant="secondary" onClick={() => form.goTo(backHref)} disabled={form.pending}>
            Précédent
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={() => form.goTo("/portail")} disabled={form.pending}>
            Tableau de bord
          </Button>
        )}
        <SaveIndicator form={form} />
        <Button type="submit" loading={form.pending}>{submitLabel}</Button>
      </div>
    </div>
  );
}
