import type { CSSProperties, ReactNode } from "react";
import { cx } from "./plaque";
import styles from "./oblique.module.css";

export interface ObliquePanelProps {
  /** Décalage horizontal de la coupe en bas (300 px pour Liaison, 160 px dans la plaque de candidature). */
  cut?: number;
  /** Épaisseur du filet or poli (4 px plein écran, 3 px dans une plaque). */
  goldLine?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Seule forme en biais du système : 3 calques découpés (or, noir, contenu)
 * qui donnent un filet or poli doublé d'un filet noir de 2 px.
 */
export function ObliquePanel({ cut = 300, goldLine = 4, className, style, children }: ObliquePanelProps) {
  const black = goldLine + 2;
  const vars = {
    "--cut": `${cut}px`,
    "--gold": `${goldLine}px`,
    "--black": `${black}px`,
    ...style,
  } as CSSProperties;
  return (
    <div className={cx(styles.gold, className)} style={vars}>
      <div className={styles.black}>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
