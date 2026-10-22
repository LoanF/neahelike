import Link from "next/link";
import type { ReactNode } from "react";
import { DotsRow, Logo, ObliquePanel, Plaque, Scene, Spiral } from "@/components/plaque";
import styles from "./auth-screen.module.css";

interface AuthScreenProps {
  title: string;
  /** Citation affichée en bas du panneau illustré. */
  quote: string;
  /** Description de l'illustration à produire pour ce panneau. */
  art: string;
  children: ReactNode;
}

/**
 * Écran plein cadre du portail : panneau oblique illustré à gauche, plaque centrée à droite.
 * Sert à la connexion, à la liaison du compte et aux écrans d'attente.
 */
export function AuthScreen({ title, quote, art, children }: AuthScreenProps) {
  return (
    <div className={styles.screen}>
      <ObliquePanel cut={300} goldLine={4} className={styles.art}>
        <Scene className={styles.scene} caption={`Illustration : ${art}`} />
      </ObliquePanel>
      <div className={styles.artFade} aria-hidden="true" />
      <Link href="/" className={styles.brand}>
        <Logo size={40} alt="" />
        <span>Néa Hélikè</span>
      </Link>
      <p className={styles.quote}>« {quote} »</p>

      <div className={styles.side}>
        <Plaque unveil className={styles.card}>
          <DotsRow className={styles.dots} />
          <div className={styles.head}>
            <Logo size={76} ring={3} />
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{title}</h1>
              <Spiral />
            </div>
          </div>
          {children}
          <DotsRow className={styles.dotsBottom} />
        </Plaque>
        <span className={styles.copyright}>© {new Date().getFullYear()} Néa Hélikè · Serveur roleplay FiveM</span>
      </div>
    </div>
  );
}
