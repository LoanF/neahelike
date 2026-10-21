"use client";

import { Lock, Trash2 } from "lucide-react";
import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Badge, Button, TextField } from "@/components/plaque";
import { avatarUrl } from "@/lib/discord-cdn";
import type { FormState } from "./actions";
import { addOwnerAction, removeOwnerAction } from "./actions";
import styles from "../admin.module.css";

export interface OwnerRow {
  id: string;
  name: string;
  avatar: string | null;
  permanent: boolean;
  self: boolean;
}

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      Ajouter
    </Button>
  );
}

/** Liste des owners : les permanents sont verrouillés, les autres se retirent d'un clic. */
export function Owners({ owners }: { owners: OwnerRow[] }) {
  const [state, action] = useActionState<FormState, FormData>(addOwnerAction, null);
  const [id, setId] = useState("");

  return (
    <div className={styles.stack}>
      <ul className={styles.rows}>
        {owners.map(owner => (
          <li key={owner.id} className={styles.row}>
            <span className={styles.person}>
              <Image src={avatarUrl({ id: owner.id, avatar: owner.avatar }, 64)} alt="" width={32} height={32} className={styles.avatar} />
              <span>
                <span className={styles.personName}>
                  {owner.name}
                  {owner.self && <Badge>Toi</Badge>}
                </span>
                <span className={styles.personId}>{owner.id}</span>
              </span>
            </span>
            {owner.permanent ? (
              <span className={styles.locked} title="Owner permanent, défini dans le code du site">
                <Lock size={14} aria-hidden="true" /> Permanent
              </span>
            ) : (
              <form action={removeOwnerAction}>
                <input type="hidden" name="discordId" value={owner.id} />
                <button type="submit" className={styles.iconButton} aria-label={`Retirer ${owner.name} des owners`} title="Retirer des owners">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <form action={action} className={styles.inline}>
        <TextField
          name="discordId"
          label="Ajouter un owner par son ID Discord"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ex. 500637897066807296"
          value={id}
          onChange={event => setId(event.target.value)}
          error={state?.error}
          hint={state?.ok}
        />
        <AddButton />
      </form>
    </div>
  );
}
