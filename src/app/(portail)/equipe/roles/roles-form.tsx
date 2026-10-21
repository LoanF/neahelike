"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, cx } from "@/components/plaque";
import type { RoleRank } from "@/lib/permissions";
import type { FormState } from "./actions";
import { saveRolesAction } from "./actions";
import styles from "../admin.module.css";

export interface RoleRow {
  id: string;
  name: string;
  color: string | null;
  rank: RoleRank;
}

const CHOICES: { id: RoleRank; label: string; hint: string }[] = [
  { id: "joueur", label: "Joueur", hint: "Accès joueur uniquement" },
  { id: "recruteur", label: "Recruteur", hint: "Lit et décide des candidatures" },
  { id: "admin", label: "Admin", hint: "Recruteur + administration" },
];

function Save({ changes }: { changes: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} disabled={changes === 0}>
      {changes === 0 ? "Aucun changement" : `Enregistrer ${changes} changement${changes > 1 ? "s" : ""}`}
    </Button>
  );
}

/** Un sélecteur à trois choix par rôle Discord ; un seul enregistrement pour tout le tableau. */
export function RolesForm({ roles }: { roles: RoleRow[] }) {
  const [state, action] = useActionState<FormState, FormData>(saveRolesAction, null);
  const [ranks, setRanks] = useState<Record<string, RoleRank>>(() => Object.fromEntries(roles.map(role => [role.id, role.rank])));
  const [query, setQuery] = useState("");
  const changes = useMemo(() => roles.filter(role => ranks[role.id] !== role.rank).length, [roles, ranks]);
  const shown = roles.filter(role => role.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <form action={action} className={styles.stack}>
      {roles.map(role => (
        <input key={role.id} type="hidden" name={`name:${role.id}`} value={role.name} />
      ))}
      <div className={styles.toolbar}>
        <input type="search" className={styles.search} placeholder="Chercher un rôle" aria-label="Chercher un rôle" value={query} onChange={event => setQuery(event.target.value)} />
        <Save changes={changes} />
      </div>
      {state?.error && <p className={styles.error} role="alert">{state.error}</p>}
      {state?.ok && changes === 0 && <p className={styles.success} role="status">{state.ok}</p>}

      <ul className={styles.rows}>
        {roles.map(role => (
          <li key={role.id} className={cx(styles.row, !shown.includes(role) && styles.hidden, ranks[role.id] !== role.rank && styles.rowChanged)}>
            <span className={styles.roleName}>
              <span className={styles.roleDot} style={{ background: role.color ?? "var(--nh-placeholder)" }} aria-hidden="true" />
              {role.name}
            </span>
            <fieldset className={styles.segmented}>
              <legend className={styles.srOnly}>Rang donné par {role.name}</legend>
              {CHOICES.map(choice => (
                <label key={choice.id} className={cx(styles.segment, ranks[role.id] === choice.id && styles.segmentOn, styles[`segment_${choice.id}`])} title={choice.hint}>
                  <input
                    type="radio"
                    name={`rank:${role.id}`}
                    value={choice.id}
                    checked={ranks[role.id] === choice.id}
                    onChange={() => setRanks(current => ({ ...current, [role.id]: choice.id }))}
                  />
                  {choice.label}
                </label>
              ))}
            </fieldset>
          </li>
        ))}
      </ul>
    </form>
  );
}
