"use client";

import { useEffect, useState } from "react";
import { Button, TextField } from "@/components/plaque";
import { useActionForm } from "@/components/use-action-form";
import styles from "../admin.module.css";
import type { InviteState } from "./actions";
import { inviteWipeAction } from "./actions";

/** Inviter un joueur whitelist à faire sa demande de wipe (après accord sur son ticket Discord). */
export function InviteForm({ players }: { players: { id: string; name: string }[] }) {
  const [state, onSubmit, pending] = useActionForm<InviteState>(inviteWipeAction, null);
  const [playerId, setPlayerId] = useState("");
  const [discordId, setDiscordId] = useState("");

  // Invitation envoyée : les champs se vident pour la suivante.
  useEffect(() => {
    if (state && "ok" in state) {
      setPlayerId("");
      setDiscordId("");
    }
  }, [state]);

  return (
    <form onSubmit={onSubmit} className={styles.stack}>
      <div className={styles.fieldGrid}>
        <label className={styles.selectField}>
          <span>Joueur whitelist</span>
          <select name="playerId" value={playerId} onChange={event => setPlayerId(event.target.value)} className={styles.select}>
            <option value="">Choisir dans la liste…</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.id})
              </option>
            ))}
          </select>
        </label>
        <TextField name="discordId" label="Ou son ID Discord" inputMode="numeric" autoComplete="off" value={discordId} onChange={event => setDiscordId(event.target.value)} hint="Prioritaire sur la liste s'il est rempli." />
      </div>
      {state && "error" in state && <p className={styles.error} role="alert">{state.error}</p>}
      {state && "ok" in state && (
        <p className={styles.success} role="status">
          Invitation envoyée : le joueur est prévenu en privé et sur le portail.{state.warnings.length > 0 && ` ${state.warnings.join(" ")}`}
        </p>
      )}
      <div>
        <Button type="submit" loading={pending}>
          Inviter à refaire son personnage
        </Button>
      </div>
    </form>
  );
}
