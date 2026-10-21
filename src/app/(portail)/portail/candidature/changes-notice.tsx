import { STEPS } from "@/lib/application";
import styles from "./candidature.module.css";

/** Rappel de la demande de modification de l'équipe, en tête de chaque étape rouverte. */
export function ChangesNotice({ steps, comment }: { steps: string[]; comment: string | null }) {
  const labels = STEPS.filter(step => steps.includes(step.id)).map(step => step.label);
  return (
    <div className={styles.changes} role="note">
      <strong>L&apos;équipe te demande de modifier : {labels.join(", ")}.</strong>
      {comment && <p className={styles.changesComment}>« {comment} »</p>}
      <span className={styles.changesHint}>Les autres parties restent verrouillées. Renvoie ta candidature depuis le récapitulatif une fois les corrections faites.</span>
    </div>
  );
}
