"use client";

import { BACKGROUND_GUIDE } from "@/content/candidature";
import type { StepValues } from "@/db/schema";
import styles from "../candidature.module.css";
import { Guide } from "./guide";
import { LinkFields } from "./link-fields";
import { StepFooter } from "./step-footer";
import type { StepChannel } from "./use-step-form";
import { useStepForm } from "./use-step-form";

export function BackgroundForm({ initial, backHref, channel }: { initial: StepValues; backHref?: string; channel?: StepChannel }) {
  const form = useStepForm("background", { shared: false, ...initial }, channel);
  return (
    <form
      className={styles.form}
      onSubmit={event => {
        event.preventDefault();
        form.submit();
      }}
      noValidate
    >
      <Guide title="Ce que l'équipe attend" intro={BACKGROUND_GUIDE.intro} items={BACKGROUND_GUIDE.items} warning={BACKGROUND_GUIDE.warning} />
      <LinkFields form={form} label="Lien vers ton background" />
      <StepFooter form={form} backHref={backHref} />
    </form>
  );
}
