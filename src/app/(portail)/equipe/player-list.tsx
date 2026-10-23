"use client";

import { FileStack } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/plaque";
import type { TeamBadge } from "@/components/equipe/badges";
import { BADGE_LABEL, BADGE_TONE } from "@/components/equipe/badges";
import { PresenceEye } from "@/components/equipe/presence-eye";
import type { Viewer } from "@/lib/team";
import { avatarUrl } from "@/lib/discord-cdn";
import { presenceSnapshot } from "./actions";
import styles from "./equipe.module.css";

export interface PlayerListRow {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  rankLabel: string | null;
  rpName: string | null;
  badge: TeamBadge;
  dossier: string | null;
  date: string | null;
  inGuild: boolean;
}

const REFRESH_MS = 10_000;

/** Liste des joueurs ; l'œil de chaque ligne se met à jour toutes les 10 s. */
export function PlayerList({ rows, initialPresence }: { rows: PlayerListRow[]; initialPresence: Record<string, Viewer[]> }) {
  const [presence, setPresence] = useState(initialPresence);
  const ids = rows.map(row => row.id).join(",");

  useEffect(() => {
    let active = true;
    const list = ids ? ids.split(",") : [];
    const refresh = () => {
      if (document.visibilityState === "visible" && list.length) presenceSnapshot(list).then(map => active && setPresence(map), () => {});
    };
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [ids]);

  if (rows.length === 0) return <p className={styles.empty}>Aucun joueur ici pour le moment.</p>;

  return (
    <ul className={styles.list}>
      {rows.map(row => (
        <li key={row.id}>
          <Link href={`/equipe/joueurs/${row.id}`} className={styles.row}>
            <Image unoptimized src={avatarUrl({ id: row.id, avatar: row.avatar }, 64)} alt="" width={40} height={40} className={styles.avatar} />
            <span className={styles.identity}>
              <span className={styles.name}>
                {row.name}
                {row.rankLabel && <Badge tone="gold">{row.rankLabel}</Badge>}
                {!row.inGuild && <Badge tone="danger">A quitté le Discord</Badge>}
              </span>
              <span className={styles.meta}>
                @{row.username} · {row.id}
              </span>
            </span>
            <span className={styles.rp}>{row.rpName ?? <span className={styles.muted}>Pas de personnage</span>}</span>
            <span className={styles.status}>
              <Badge tone={BADGE_TONE[row.badge]}>{BADGE_LABEL[row.badge]}</Badge>
              {row.dossier && (
                <span className={styles.dossier} title="Dossier de reprise">
                  <FileStack size={14} aria-hidden="true" /> {row.dossier}
                </span>
              )}
            </span>
            <span className={styles.date}>{row.date}</span>
            <span className={styles.eyeSlot}>
              <PresenceEye viewers={presence[row.id] ?? []} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
