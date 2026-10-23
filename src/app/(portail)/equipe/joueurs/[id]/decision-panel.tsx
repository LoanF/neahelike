"use client";

import { useEffect, useState } from "react";
import { Button, PinCheckbox, TextAreaField, TextField } from "@/components/plaque";
import { useActionForm } from "@/components/use-action-form";
import type { ApplicationStatus } from "@/db/schema";
import type { DecisionState } from "../../actions";
import { decide } from "../../actions";
import styles from "./fiche.module.css";

type Mode = "valider" | "modifier" | "refuser" | "entretien" | "supprimer" | "lever" | "rouvrir";

interface DecisionPanelProps {
  subjectId: string;
  applicationId: string;
  status: ApplicationStatus;
  isAdmin: boolean;
  /** Étapes que le joueur a remplies, pour « Demander une modification ». */
  steps: { id: string; label: string }[];
  /** Critères de refus actifs (administration). */
  criteria: { id: string; label: string }[];
  /** Session de whitelist annoncée au joueur, pendant l'entretien. */
  session?: string | null;
  /** Refus : délai de 3 mois déjà levé par un admin. */
  reapplyLifted?: boolean;
}

const CONFIRM: Record<Mode, { label: string; text: string; variant: "primary" | "danger" }> = {
  valider: { label: "Confirmer la validation", text: "Le joueur reçoit le rôle « attente de wl » et un message privé avec la date de la prochaine session de whitelist.", variant: "primary" },
  entretien: { label: "Confirmer la whitelist", text: "Le joueur reçoit le rôle « Magistrat (wl) », perd « attente de wl » et reçoit un message privé.", variant: "primary" },
  modifier: { label: "Envoyer la demande", text: "Seules les parties cochées se rouvrent. Le joueur reçoit ton message en privé.", variant: "primary" },
  refuser: { label: "Confirmer le refus", text: "Le joueur reçoit les critères en privé. Il pourra recandidater dans 3 mois.", variant: "danger" },
  lever: { label: "Lever le délai", text: "Le refus reste dans l'historique, mais le joueur peut déposer une nouvelle candidature tout de suite. Il est prévenu en privé.", variant: "primary" },
  rouvrir: { label: "Rouvrir la candidature", text: "Le refus est annulé : la candidature revient « à traiter », comme si elle venait d'être envoyée. Le joueur est prévenu en privé.", variant: "primary" },
  supprimer: { label: "Effacer définitivement", text: "La candidature est effacée sans délai : le joueur peut en recommencer une tout de suite.", variant: "danger" },
};

function Submit({ mode, pending }: { mode: Mode; pending: boolean }) {
  return (
    <Button type="submit" variant={CONFIRM[mode].variant} loading={pending}>
      {CONFIRM[mode].label}
    </Button>
  );
}

/** Actions de l'équipe sur une candidature, chacune avec une étape de confirmation. */
export function DecisionPanel({ subjectId, applicationId, status, isAdmin, steps, criteria, session, reapplyLifted }: DecisionPanelProps) {
  const [state, onSubmit, pending] = useActionForm<DecisionState>(decide, null);
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
  } else if (isAdmin && (status === "brouillon" || status === "a_modifier")) {
    choices.push({ mode: "valider", label: "Valider sans attendre", variant: "primary" });
    choices.push({ mode: "refuser", label: "Refuser", variant: "danger" });
  }
  if (isAdmin && status === "refusee") {
    choices.push({ mode: "rouvrir", label: "Rouvrir la candidature", variant: "primary" });
    if (!reapplyLifted) choices.push({ mode: "lever", label: "Lever le délai de 3 mois", variant: "primary" });
  }
  if (isAdmin) choices.push({ mode: "supprimer", label: "Effacer la candidature", variant: "primary" });

  const waiting =
    status === "brouillon" || status === "a_modifier"
      ? "En attente du joueur : la candidature n'est pas encore envoyée."
      : status === "entretien" && session
        ? `Session de whitelist annoncée : ${session} (heure de Paris).`
        : status === "whitelistee"
        ? "Joueur whitelist."
        : status === "refusee"
          ? reapplyLifted
            ? "Candidature refusée. Délai levé : le joueur peut recandidater."
            : "Candidature refusée."
          : null;

  return (
    <div className={styles.decision}>
      {waiting && <p className={styles.waiting}>{waiting}{!isAdmin && (status === "brouillon" || status === "a_modifier") ? " Seul un admin peut la valider avant l'envoi." : ""}</p>}

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
        <form onSubmit={onSubmit} className={styles.confirm}>
          <input type="hidden" name="decision" value={mode} />
          <input type="hidden" name="subjectId" value={subjectId} />
          <input type="hidden" name="applicationId" value={applicationId} />
          <p className={styles.confirmText}>{CONFIRM[mode].text}</p>

          {mode === "valider" && <SessionFields />}
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
              {criteria.map(criterion => (
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
            <Submit pending={pending} mode={mode} />
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

/** Date et tranche horaire de la prochaine session de whitelist (heure de Paris). */
function SessionFields() {
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  return (
    <fieldset className={styles.fieldset}>
      <legend>Prochaine session de whitelist</legend>
      <TextField type="date" name="sessionDate" label="Date" required min={today} value={date} onChange={event => setDate(event.target.value)} className={styles.slotField} />
      <div className={styles.slotRow}>
        <TextField type="time" name="sessionFrom" label="De" required value={from} onChange={event => setFrom(event.target.value)} className={styles.slotField} />
        <TextField type="time" name="sessionTo" label="À" required value={to} onChange={event => setTo(event.target.value)} className={styles.slotField} hint="Heure de Paris" />
      </div>
    </fieldset>
  );
}

/** Champ contrôlé pour que le compteur de caractères suive la saisie. */
function CommentField(props: Omit<React.ComponentProps<typeof TextAreaField>, "value" | "onChange">) {
  const [value, setValue] = useState("");
  return <TextAreaField {...props} value={value} onChange={event => setValue(event.target.value)} />;
}
