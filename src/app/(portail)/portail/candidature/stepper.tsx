import { Check, Lock } from "lucide-react";
import Link from "next/link";
import { cx } from "@/components/plaque";
import type { Application } from "@/db/schema";
import type { StepId } from "@/lib/application";
import { canAccessStep, isStepComplete, stepHref, visibleSteps } from "@/lib/application";
import styles from "./candidature.module.css";

/** Fil des étapes : terminée (coche), en cours (lamelle dorée), accessible ou verrouillée. */
export function Stepper({ application, current }: { application: Application; current: StepId }) {
  const steps = visibleSteps(application);
  return (
    <nav aria-label="Étapes de la candidature">
      <ol className={styles.stepper}>
        {steps.map((step, index) => {
          const active = step.id === current;
          const reachable = canAccessStep(application, step.id);
          // Une étape remplie mais derrière une étape incomplète reste affichée verrouillée.
          const done = reachable && step.id !== "recapitulatif" && isStepComplete(application, step.id);
          const content = (
            <>
              <span className={styles.stepNumber} aria-hidden="true">
                {done && !active ? <Check size={14} /> : reachable ? index + 1 : <Lock size={12} />}
              </span>
              <span className={styles.stepLabel}>{step.label}</span>
            </>
          );
          return (
            <li key={step.id} className={cx(styles.step, active && styles.stepActive, done && styles.stepDone, !reachable && styles.stepLocked)}>
              {reachable && !active ? (
                <Link href={stepHref(step.id)} className={styles.stepLink}>{content}</Link>
              ) : (
                <span className={styles.stepLink} aria-current={active ? "step" : undefined}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
