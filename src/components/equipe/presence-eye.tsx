"use client";

import Image from "next/image";
import { cx } from "@/components/plaque";
import type { Viewer } from "@/lib/team";
import { avatarUrl, displayName } from "@/lib/discord-cdn";
import styles from "./presence-eye.module.css";

/**
 * Œil animé « en cours de lecture » : il cligne tant qu'un membre de l'équipe consulte la fiche.
 * Au survol (ou au focus clavier), on voit qui.
 */
export function PresenceEye({ viewers, size = 22, className }: { viewers: Viewer[]; size?: number; className?: string }) {
  if (viewers.length === 0) return null;
  const names = viewers.map(viewer => displayName(viewer)).join(", ");
  return (
    <span className={cx(styles.eye, className)} tabIndex={0} role="img" aria-label={`En cours de lecture par ${names}`}>
      <svg width={size} height={size * 0.62} viewBox="0 0 32 20" aria-hidden="true">
        <g className={styles.lid}>
          <path d="M2 10C6 3.8 10.8 1 16 1s10 2.8 14 9c-4 6.2-8.8 9-14 9S6 16.2 2 10Z" fill="var(--nh-bronze-deep)" stroke="var(--nh-gold)" strokeWidth="1.8" />
          <circle cx="16" cy="10" r="5" fill="var(--nh-gold)" />
          <circle cx="16" cy="10" r="2.2" fill="var(--nh-bronze-deep)" />
          <circle cx="17.6" cy="8.4" r="1" fill="var(--nh-gold-lit)" />
        </g>
      </svg>
      <span className={styles.tooltip} role="tooltip">
        <span className={styles.tooltipTitle}>En cours de lecture</span>
        {viewers.map(viewer => (
          <span key={viewer.id} className={styles.viewer}>
            <Image src={avatarUrl(viewer, 32)} alt="" width={20} height={20} className={styles.avatar} />
            {displayName(viewer)}
          </span>
        ))}
      </span>
    </span>
  );
}
