"use client";

import { PinCheckbox, TextField } from "@/components/plaque";
import { LINK_HOSTS_HINT, SHARED_LINK_HINT } from "@/content/candidature";
import styles from "../candidature.module.css";
import type { StepForm } from "./use-step-form";
import { text } from "./use-step-form";

/** Lien vers un document externe et confirmation de partage public (background, dossier). */
export function LinkFields({ form, label }: { form: StepForm; label: string }) {
  const { values, set, errors } = form;
  return (
    <>
      <TextField
        label={label}
        required
        type="url"
        inputMode="url"
        autoComplete="off"
        placeholder="https://"
        value={text(values, "url")}
        onChange={event => set("url", event.target.value)}
        error={errors.url}
        hint={LINK_HOSTS_HINT}
      />
      <div className={styles.checks}>
        <PinCheckbox checked={values.shared === true} onChange={event => set("shared", event.target.checked)} data-invalid={errors.shared ? "true" : undefined}>
          Mon document est partagé en lecture
          <span className={styles.checkHint}>{SHARED_LINK_HINT}</span>
        </PinCheckbox>
        {errors.shared && <p className={styles.fieldError} role="alert">{errors.shared}</p>}
      </div>
    </>
  );
}
