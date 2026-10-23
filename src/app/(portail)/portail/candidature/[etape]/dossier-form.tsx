"use client";

import { TextField } from "@/components/plaque";
import { DOSSIER_GUIDE, DOSSIER_KINDS, NEW_BUSINESS } from "@/content/candidature";
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
  /** Ce qui peut être repris, avec sa disponibilité, par type de dossier. */
  leads: { affinite: Choice[]; creature: Choice[]; entreprise: Choice[] };
  backHref?: string;
}

const NEW_BUSINESS_CHOICE: Choice = { id: NEW_BUSINESS, name: "Une nouvelle entreprise", meta: "Elle n'existe pas encore : tu la proposes." };

export function DossierForm({ initial, leads, backHref }: DossierFormProps) {
  const form = useStepForm("dossier", { kind: "", target: "", targetName: "", shared: false, ...initial });
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
          set("targetName", "");
        }}
        error={errors.kind}
      />

      {kind && (
        <ChoiceGrid
          name="target"
          legend={kind === "entreprise" ? "Quelle entreprise ?" : kind === "affinite" ? "Le lead de quelle affinité ?" : "Le lead de quelle créature ?"}
          choices={kind === "entreprise" ? [...leads.entreprise, NEW_BUSINESS_CHOICE] : kind === "affinite" ? leads.affinite : leads.creature}
          value={text(values, "target")}
          onChange={value => set("target", value)}
          closedLabel="Déjà repris"
          error={errors.target}
        />
      )}
      {kind === "entreprise" && text(values, "target") === NEW_BUSINESS && (
        <TextField
          label="Nom de la nouvelle entreprise"
          required
          autoComplete="off"
          maxLength={80}
          placeholder="La forge du port, la taverne de l'Agora…"
          value={text(values, "targetName")}
          onChange={event => set("targetName", event.target.value)}
          error={errors.targetName}
        />
      )}

      <LinkFields form={form} label="Lien vers ton dossier" />
      <StepFooter form={form} backHref={backHref} />
    </form>
  );
}
