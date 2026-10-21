"use client";

import { useCallback, useState } from "react";
import type { FactionKind } from "@/db/schema";
import type { LoreField } from "./faction-form";
import { FactionForm } from "./faction-form";
import styles from "../admin.module.css";

/** Modification du lore d'une affinité ou créature ajoutée depuis le site. */
export function EditFaction({ id, kind, lore, fields }: { id: string; kind: FactionKind; lore: Record<string, string | boolean>; fields: Record<FactionKind, LoreField[]> }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <div className={styles.editSlot}>
      <button type="button" className={styles.textButton} aria-expanded={open} onClick={() => setOpen(value => !value)}>
        {open ? "Fermer" : "Modifier le lore"}
      </button>
      {open && (
        <div className={styles.editBox}>
          <FactionForm id={id} kind={kind} initial={lore} fields={fields} onDone={close} />
        </div>
      )}
    </div>
  );
}
