"use client";

import { TextField } from "@/components/plaque";
import { DOSSIER_GUIDE, DOSSIER_KINDS } from "@/content/candidature";
import type { StepValues } from "@/db/schema";
import styles from "../candidature.module.css";
import type { Choice } from "./choice-grid";
import { ChoiceGrid } from "./choice-grid";
import { Guide } from "./guide";
import { LinkFields } from "./link-fields";
import { StepFooter } from "./step-footer";
import { text, useStepForm } from "./use-step-form";

interface DossierFormProps {
  initial: StepValues;
  affinities: Choice[];
  creatures: Choice[];
  backHref: string;
}

export function DossierForm({ initial, affinities, creatures, backHref }: DossierFormProps) {
  const form = useStepForm("dossier", { kind: "", target: "", shared: false, ...initial });
  const { values, set, errors } = form;
  const kind = text(values, "kind");

  return (
    <form
      className={styles.form}
      onSubmit={event => {
        event.preventDefault();
        form.submit();
      }}
      noValidate
    >
      <Guide title="Ce que doit contenir ton dossier" intro={DOSSIER_GUIDE.intro} items={DOSSIER_GUIDE.items} />

      <ChoiceGrid
        name="kind"
        legend="Que veux-tu reprendre ?"
        choices={DOSSIER_KINDS.map(item => ({ id: item.id, name: item.label, meta: item.text }))}
        value={kind}
        onChange={value => {
          set("kind", value);
          set("target", "");
        }}
        error={errors.kind}
      />

      {kind === "entreprise" && (
        <TextField
          label="Nom de l'entreprise"
          required
          autoComplete="off"
          maxLength={80}
          placeholder="La forge du port, la taverne de l'Agora…"
          value={text(values, "target")}
          onChange={event => set("target", event.target.value)}
          error={errors.target}
        />
      )}
      {(kind === "affinite" || kind === "creature") && (
        <ChoiceGrid
          name="target"
          legend={kind === "affinite" ? "Quelle affinité ?" : "Quelle créature ?"}
          choices={kind === "affinite" ? affinities : creatures}
          value={text(values, "target")}
          onChange={value => set("target", value)}
          error={errors.target}
        />
      )}

      <LinkFields form={form} label="Lien vers ton dossier" />
      <StepFooter form={form} backHref={backHref} />
    </form>
  );
}
