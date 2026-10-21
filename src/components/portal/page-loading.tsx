import { DotsRow, Plaque } from "@/components/plaque";
import styles from "./page-loading.module.css";

/**
 * Écran d'attente des pages du portail : affiché aussitôt le clic,
 * pendant que le serveur prépare la page (session, rôles Discord, données).
 */
export function PageLoading() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.srOnly}>Chargement…</span>
      <div className={styles.head} aria-hidden="true">
        <span className={styles.eyebrow} />
        <span className={styles.title} />
        <span className={styles.line} />
      </div>
      <Plaque className={styles.panel} aria-hidden="true">
        <DotsRow className={styles.dots} />
        <span className={styles.line} />
        <span className={styles.line} />
        <span className={`${styles.line} ${styles.short}`} />
        <span className={styles.block} />
      </Plaque>
    </div>
  );
}
