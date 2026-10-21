"use client";

import { PinCheckbox, TextAreaField, TextField } from "@/components/plaque";
import { MIN_AGE_IRL } from "@/content/candidature";
import type { StepValues } from "@/db/schema";
import styles from "../candidature.module.css";
import { StepFooter } from "./step-footer";
import { text, useStepForm } from "./use-step-form";

export function HrpForm({ initial, discord }: { initial: StepValues; discord: { username: string; id: string } }) {
  const form = useStepForm("hrp", { goodMic: false, wantsDossier: false, ...initial });
  const { values, set, errors } = form;

  return (
    <form
      className={styles.form}
      onSubmit={event => {
        event.preventDefault();
        form.submit();
      }}
      noValidate
    >
      <div className={styles.row}>
        <TextField label="Pseudo Discord" value={discord.username} locked />
        <TextField label="ID Discord" value={discord.id} locked />
      </div>
      <div className={styles.row}>
        <TextField
          label="Âge"
          required
          inputMode="numeric"
          autoComplete="off"
          value={text(values, "age")}
          onChange={event => set("age", event.target.value)}
          error={errors.age}
          hint={`${MIN_AGE_IRL} ans minimum. Ton âge reste visible uniquement par l'équipe.`}
        />
        <TextField
          label="Heures de RP"
          required
          inputMode="numeric"
          autoComplete="off"
          value={text(values, "rpHours")}
          onChange={event => set("rpHours", event.target.value)}
          error={errors.rpHours}
          hint="Une estimation suffit, tous serveurs confondus."
        />
      </div>
      <TextAreaField
        label="Tes expériences RP"
        required
        maxLength={2000}
        placeholder="Les serveurs où tu as joué, les personnages que tu as incarnés, combien de temps…"
        value={text(values, "experience")}
        onChange={event => set("experience", event.target.value)}
        error={errors.experience}
      />
      <div className={styles.checks}>
        <PinCheckbox checked={values.goodMic === true} onChange={event => set("goodMic", event.target.checked)}>
          J&apos;ai un micro de bonne qualité
        </PinCheckbox>
        <PinCheckbox checked={values.wantsDossier === true} onChange={event => set("wantsDossier", event.target.checked)}>
          Je souhaite déposer un dossier de reprise : une entreprise, ou le lead d&apos;une affinité ou d&apos;une créature
          <span className={styles.checkHint}>Une étape « Dossier » s&apos;ajoutera après le background.</span>
        </PinCheckbox>
      </div>
      <StepFooter form={form} />
    </form>
  );
}
