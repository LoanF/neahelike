"use client";

import { TextAreaField, TextField } from "@/components/plaque";
import type { StepValues } from "@/db/schema";
import styles from "../candidature.module.css";
import type { Choice } from "./choice-grid";
import { ChoiceGrid } from "./choice-grid";
import { StepFooter } from "./step-footer";
import { text, useStepForm } from "./use-step-form";

interface RpFormProps {
  initial: StepValues;
  affinities: Choice[];
  creatures: Choice[];
  backHref?: string;
}

export function RpForm({ initial, affinities, creatures, backHref }: RpFormProps) {
  const form = useStepForm("rp", { affinity: "", creature: "", ...initial });
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
        <TextField label="Prénom" required autoComplete="off" value={text(values, "firstName")} onChange={event => set("firstName", event.target.value)} error={errors.firstName} />
        <TextField label="Nom" required autoComplete="off" value={text(values, "lastName")} onChange={event => set("lastName", event.target.value)} error={errors.lastName} />
      </div>
      <div className={styles.row}>
        <TextField
          label="Âge du personnage"
          required
          inputMode="numeric"
          autoComplete="off"
          value={text(values, "age")}
          onChange={event => set("age", event.target.value)}
          error={errors.age}
          hint="Ton personnage doit être majeur : 18 ans minimum."
        />
      </div>
      <TextAreaField
        label="Origine du personnage"
        required
        maxLength={1000}
        placeholder="D'où vient-il ? Une cité grecque, un peuple lointain, un rescapé d'Hélikè…"
        value={text(values, "origin")}
        onChange={event => set("origin", event.target.value)}
        error={errors.origin}
      />

      <p className={styles.notice}>
        Ton personnage peut rejoindre une affinité, être une créature mystique, les deux à la fois, ou rester un simple citoyen.
      </p>

      <ChoiceGrid
        name="affinity"
        legend="Affinité divine"
        hint="Une seule affinité à la fois. Il faudra ensuite être accepté par son prêtre en jeu."
        choices={affinities}
        value={text(values, "affinity")}
        onChange={value => set("affinity", value)}
        noneLabel="Aucune affinité"
        error={errors.affinity}
      />
      <ChoiceGrid
        name="creature"
        legend="Créature mystique"
        hint="Les créatures sont solitaires : ni clan, ni chef au départ."
        choices={creatures}
        value={text(values, "creature")}
        onChange={value => set("creature", value)}
        noneLabel="Humain"
        error={errors.creature}
      />
      <StepFooter form={form} backHref={backHref} />
    </form>
  );
}
