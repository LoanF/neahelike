"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, PinCheckbox, TextAreaField } from "@/components/plaque";
import { REFUSAL_CRITERIA } from "@/content/staff";
import type { ApplicationStatus } from "@/db/schema";
import type { DecisionState } from "../../actions";
import { decide } from "../../actions";
import styles from "./fiche.module.css";

type Mode = "valider" | "modifier" | "refuser" | "entretien" | "supprimer";

interface DecisionPanelProps {
  subjectId: string;
  applicationId: string;
  status: ApplicationStatus;
  isStaff: boolean;
  /** Étapes que le joueur a remplies, pour « Demander une modification ». */
  steps: { id: string; label: string }[];
}

const CONFIRM: Record<Mode, { label: string; text: string; variant: "primary" | "danger" }> = {
  valider: { label: "Confirmer la validation", text: "Le joueur reçoit le rôle « attente de wl » et un message privé l'invite à passer son entretien vocal.", variant: "primary" },
  entretien: { label: "Confirmer la whitelist", text: "Le joueur reçoit le rôle « Magistrat (wl) », perd « attente de wl » et reçoit un message privé.", variant: "primary" },
  modifier: { label: "Envoyer la demande", text: "Seules les parties cochées se rouvrent. Le joueur reçoit ton message en privé.", variant: "primary" },
  refuser: { label: "Confirmer le refus", text: "Le joueur reçoit les critères en privé. Il pourra recandidater dans 3 mois.", variant: "danger" },
  supprimer: { label: "Effacer définitivement", text: "La candidature est effacée sans délai : le joueur peut en recommencer une tout de suite.", variant: "danger" },
};

function Submit({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={CONFIRM[mode].variant} loading={pending}>
      {CONFIRM[mode].label}
    </Button>
  );
}

/** Actions de l'équipe sur une candidature, chacune avec une étape de confirmation. */
export function DecisionPanel({ subjectId, applicationId, status, isStaff, steps }: DecisionPanelProps) {
  const [state, action] = useActionState<DecisionState, FormData>(decide, null);
  const [mode, setMode] = useState<Mode | null>(null);

  // Décision prise : on referme le formulaire.
  useEffect(() => {
    if (state && "ok" in state) setMode(null);
  }, [state]);

  const choices: { mode: Mode; label: string; variant: "primary" | "secondary" | "danger" | "ghost" }[] = [];
  if (status === "envoyee") {
    choices.push({ mode: "valider", label: "Valider la candidature", variant: "primary" });
    choices.push({ mode: "modifier", label: "Demander une modification", variant: "secondary" });
    choices.push({ mode: "refuser", label: "Refuser", variant: "danger" });
  } else if (status === "entretien") {
    choices.push({ mode: "entretien", label: "Valider l'entretien vocal", variant: "primary" });
    choices.push({ mode: "refuser", label: "Refuser", variant: "danger" });
  } else if (isStaff && (status === "brouillon" || status === "a_modifier")) {
    choices.push({ mode: "valider", label: "Valider sans attendre", variant: "primary" });
    choices.push({ mode: "refuser", label: "Refuser", variant: "danger" });
  }
  if (isStaff) choices.push({ mode: "supprimer", label: "Effacer la candidature", variant: "ghost" });

  const waiting =
    status === "brouillon" || status === "a_modifier"
      ? "En attente du joueur : la candidature n'est pas encore envoyée."
      : status === "whitelistee"
        ? "Joueur whitelisté."
        : status === "refusee"
          ? "Candidature refusée."
          : null;

  return (
    <div className={styles.decision}>
      {waiting && <p className={styles.waiting}>{waiting}{!isStaff && (status === "brouillon" || status === "a_modifier") ? " Seul le staff peut la valider avant l'envoi." : ""}</p>}

      {state && "error" in state && <p className={styles.formError} role="alert">{state.error}</p>}
      {state && "ok" in state && (
        <div className={styles.success} role="status">
          Décision enregistrée.
          {state.warnings.length > 0 && (
            <ul>
              {state.warnings.map(warning => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!mode && choices.length > 0 && (
        <div className={styles.choices}>
          {choices.map(choice => (
            <Button key={choice.mode} type="button" variant={choice.variant} onClick={() => setMode(choice.mode)}>
              {choice.label}
            </Button>
          ))}
        </div>
      )}

      {mode && (
        <form action={action} className={styles.confirm}>
          <input type="hidden" name="decision" value={mode} />
          <input type="hidden" name="subjectId" value={subjectId} />
          <input type="hidden" name="applicationId" value={applicationId} />
          <p className={styles.confirmText}>{CONFIRM[mode].text}</p>

          {mode === "modifier" && (
            <fieldset className={styles.fieldset}>
              <legend>Parties à rouvrir</legend>
              {steps.map(step => (
                <CheckItem key={step.id} name="steps" value={step.id} label={step.label} />
              ))}
            </fieldset>
          )}
          {mode === "refuser" && (
            <fieldset className={styles.fieldset}>
              <legend>Critères de refus</legend>
              {REFUSAL_CRITERIA.map(criterion => (
                <CheckItem key={criterion.id} name="criteria" value={criterion.id} label={criterion.label} />
              ))}
            </fieldset>
          )}
          {(mode === "modifier" || mode === "refuser") && (
            <CommentField
              name="comment"
              label={mode === "modifier" ? "Message au joueur" : "Commentaire (envoyé au joueur)"}
              required={mode === "modifier"}
              maxLength={1000}
              placeholder={mode === "modifier" ? "Ce qu'il doit corriger, et comment." : "Facultatif, sauf pour le critère « Autre »."}
            />
          )}

          <div className={styles.confirmActions}>
            <Button type="button" variant="ghost" onClick={() => setMode(null)}>
              Annuler
            </Button>
            <Submit mode={mode} />
          </div>
        </form>
      )}
    </div>
  );
}

function CheckItem({ name, value, label }: { name: string; value: string; label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <PinCheckbox name={name} value={value} checked={checked} onChange={event => setChecked(event.target.checked)}>
      {label}
    </PinCheckbox>
  );
}

/** Champ contrôlé pour que le compteur de caractères suive la saisie. */
function CommentField(props: Omit<React.ComponentProps<typeof TextAreaField>, "value" | "onChange">) {
  const [value, setValue] = useState("");
  return <TextAreaField {...props} value={value} onChange={event => setValue(event.target.value)} />;
}
