import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import styles from "./plaque.module.css";

type Rivets = "both" | "left" | "right" | "none";

export interface PlaqueProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  rivets?: Rivets;
  /** Joue le dévoilement de haut en bas à l'apparition. */
  unveil?: boolean;
  /** Voile doré au survol (cartes cliquables). */
  interactive?: boolean;
  children?: ReactNode;
}

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Panneau de bronze martelé, bord or, rivets aux coins du haut. */
export function Plaque({ as: Tag = "div", rivets = "both", unveil, interactive, className, children, ...rest }: PlaqueProps) {
  return (
    <Tag className={cx(styles.plaque, unveil && styles.unveil, interactive && styles.interactive, className)} {...rest}>
      {(rivets === "both" || rivets === "left") && <Rivet side="left" />}
      {(rivets === "both" || rivets === "right") && <Rivet side="right" />}
      {children}
    </Tag>
  );
}

export function Rivet({ side, style }: { side: "left" | "right"; style?: CSSProperties }) {
  return <span aria-hidden="true" className={cx(styles.rivet, side === "left" ? styles.rivetLeft : styles.rivetRight)} style={style} />;
}

/** Rangée de points poinçonnés, au-dessus d'un en-tête de plaque. */
export function DotsRow({ width, className, style }: { width?: number | string; className?: string; style?: CSSProperties }) {
  return <div aria-hidden="true" className={cx(styles.dots, className)} style={{ width, ...style }} />;
}

/** Spirale mycénienne : une seule par écran, à droite d'un titre majeur. */
export function Spiral({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg className={cx(styles.spiral, className)} width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <path
        d="M17 17a2 2 0 0 1 4 0a4 4 0 0 1-8 0a6 6 0 0 1 12 0a8 8 0 0 1-16 0a10 10 0 0 1 20 0a12 12 0 0 1-24 0"
        fill="none"
        stroke="var(--nh-gold)"
        strokeWidth={2.4}
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Socket({ as: Tag = "div", className, ...rest }: HTMLAttributes<HTMLElement> & { as?: ElementType }) {
  return <Tag className={cx(styles.socket, className)} {...rest} />;
}

export function Selection({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={cx(styles.selection, className)} style={style} />;
}

export type BadgeTone = "default" | "gold" | "success" | "danger";

export function Badge({ tone = "default", size = "md", className, children }: { tone?: BadgeTone; size?: "md" | "lg"; className?: string; children: ReactNode }) {
  return (
    <span
      className={cx(
        styles.badge,
        size === "lg" && styles.badgeLg,
        tone === "gold" && styles.badgeGold,
        tone === "success" && styles.badgeSuccess,
        tone === "danger" && styles.badgeDanger,
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Pin de 14 px : cavité éteinte, dôme doré allumé. Purement visuel. */
export function Pin({ on, className }: { on: boolean; className?: string }) {
  return <span aria-hidden="true" className={cx(styles.pin, on && styles.pinOn, className)} />;
}

/** Logo officiel rogné en cercle, avec anneau gold-deep. */
export function Logo({ size = 44, ring = 1, className }: { size?: number; ring?: 1 | 2 | 3; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- petit PNG statique, l'optimiseur n'apporte rien ici
    <img
      src="/images/logo.png"
      alt="Néa Hélikè"
      width={size}
      height={size}
      className={cx(styles.logo, className)}
      style={{ width: size, height: size, boxShadow: `0 0 0 1px #000, 0 0 0 ${ring + 1}px var(--nh-gold-deep)${size > 60 ? ", 0 10px 20px -8px #000" : ""}` }}
    />
  );
}

/**
 * Emplacement d'illustration sur fond « scène ».
 * Tant que l'image n'existe pas, la description de l'illustration attendue s'affiche en légende discrète.
 */
export function Scene({ src, alt = "", caption, className, style, children }: { src?: string; alt?: string; caption?: string; className?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div className={cx(styles.scene, className)} style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- les illustrations seront servies telles quelles
        <img src={src} alt={alt} className={styles.sceneImage} />
      ) : caption ? (
        <span className={styles.sceneCaption}>{caption}</span>
      ) : null}
      {children}
    </div>
  );
}
