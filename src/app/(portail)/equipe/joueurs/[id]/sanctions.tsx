"use client";

import { useState } from "react";
import { Button, TextAreaField, TextField } from "@/components/plaque";
import { useActionForm } from "@/components/use-action-form";
import type { SanctionState } from "../../actions";
import { sanctionAction } from "../../actions";
import styles from "./fiche.module.css";

type Mode = "retirer" | "blacklist" | "lever";

const CONFIRM: Record<Mode, { text: string; submit: string; reason: boolean }> = {
  retirer: {
    text: "Le joueur perd le rôle « Magistrat (wl) », retrouve le rôle Novice et reçoit un message privé. Sa candidature reste dans l'historique ; il peut en déposer une nouvelle tout de suite.",
    submit: "Retirer la whitelist",
    reason: true,
  },
  blacklist: {
    text: "Le joueur est banni du Discord et ne voit plus qu'une page de blocage sur le portail. Il reçoit un message privé juste avant le bannissement. Sa whitelist éventuelle est retirée.",
    submit: "Blacklister",
    reason: true,
  },
  lever: {
    text: "Le bannissement Discord est levé et le joueur retrouve l'accès au portail. Il devra rejoindre le serveur et, s'il n'est plus whitelist, déposer une nouvelle candidature.",
    submit: "Lever la blacklist",
    reason: false,
  },
};

function Submit({ mode, ready, pending }: { mode: Mode; ready: boolean; pending: boolean }) {
  return (
    <Button type="submit" variant={mode === "lever" ? "primary" : "danger"} disabled={!ready} loading={pending}>
      {CONFIRM[mode].submit}
    </Button>
  );
}

/** Admin : retrait de whitelist, blacklist et levée de la blacklist, depuis la fiche joueur. */
export function Sanctions({ subjectId, canRevoke, blacklisted }: { subjectId: string; canRevoke: boolean; blacklisted: boolean }) {
  const [state, onSubmit, pending] = useActionForm<SanctionState>(async (previous, formData) => {
    const result = await sanctionAction(previous, formData);
    if (result && "ok" in result) setMode(null);
    return result;
  }, null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const choose = (next: Mode) => {
    setMode(next);
    setReason("");
    setConfirmation("");
  };

  return (
    <div className={styles.sanctions}>
      {state && "error" in state && <p className={styles.formError} role="alert">{state.error}</p>}
      {state && "ok" in state && (
        <div className={styles.success} role="status">
          C&apos;est fait.
          {state.warnings.length > 0 && (
            <ul>
              {state.warnings.map(warning => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!mode && (
        <div className={styles.choices}>
          {canRevoke && !blacklisted && (
            <Button type="button" variant="secondary" onClick={() => choose("retirer")}>
              Retirer la whitelist…
            </Button>
          )}
          {blacklisted ? (
            <Button type="button" variant="secondary" onClick={() => choose("lever")}>
              Lever la blacklist…
            </Button>
          ) : (
            <Button type="button" variant="danger" onClick={() => choose("blacklist")}>
              Blacklister…
            </Button>
          )}
        </div>
      )}

      {mode && (
        <form onSubmit={onSubmit} className={styles.confirm}>
          <input type="hidden" name="subjectId" value={subjectId} />
          <input type="hidden" name="sanction" value={mode} />
          <p className={styles.confirmText}>{CONFIRM[mode].text}</p>
          {CONFIRM[mode].reason && (
            <TextAreaField name="reason" label="Raison (facultative, montrée au joueur)" maxLength={500} value={reason} onChange={event => setReason(event.target.value)} />
          )}
          {mode === "blacklist" && (
            <TextField name="confirmation" label="Recopie BLACKLIST pour confirmer" autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} />
          )}
          <div className={styles.confirmActions}>
            <Button type="button" variant="ghost" onClick={() => setMode(null)}>
              Annuler
            </Button>
            <Submit pending={pending} mode={mode} ready={mode !== "blacklist" || confirmation.trim().toUpperCase() === "BLACKLIST"} />
          </div>
        </form>
      )}
    </div>
  );
}
