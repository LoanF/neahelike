import styles from "../candidature.module.css";

/** Encadré de consignes (background, dossier). */
export function Guide({ title, intro, items, warning }: { title: string; intro: string; items: readonly string[]; warning?: string }) {
  return (
    <aside className={styles.guide} aria-label={title}>
      <h2 className={styles.guideTitle}>{title}</h2>
      <p>{intro}</p>
      <ul>
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {warning && <p className={styles.guideWarning}>{warning}</p>}
    </aside>
  );
}
