import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cx, Pin } from "./plaque";
import styles from "./form.module.css";

interface FieldShellProps {
  label: ReactNode;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
}

function FieldShell({ id, label, required, error, hint, className, children }: FieldShellProps & { id: string; children: ReactNode }) {
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required} aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <span id={`${id}-error`} className={styles.error} role="alert">{error}</span>
      ) : hint ? (
        <span id={`${id}-hint`} className={styles.hint}>{hint}</span>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends FieldShellProps, Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  /** Champ issu de la session (pseudo, ID Discord) : lecture seule, mention « Verrouillé ». */
  locked?: boolean;
}

export function TextField({ label, required, error, hint, className, locked, id, ...input }: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} required={required} error={error} hint={hint} className={className}>
      <div className={styles.control}>
        <input
          id={fieldId}
          className={cx(styles.input, locked && styles.locked, locked && styles.withSuffix, error && styles.invalid)}
          readOnly={locked || input.readOnly}
          aria-readonly={locked || undefined}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...input}
        />
        {locked && <span className={styles.suffix}>Verrouillé</span>}
      </div>
    </FieldShell>
  );
}

export interface TextAreaFieldProps extends FieldShellProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  /** Affiche le compteur « N / max » en bas à droite. */
  maxLength?: number;
}

export function TextAreaField({ label, required, error, hint, className, id, maxLength, value, ...textarea }: TextAreaFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const length = typeof value === "string" ? value.length : 0;
  return (
    <FieldShell id={fieldId} label={label} required={required} error={error} hint={hint} className={className}>
      <div className={styles.control}>
        <textarea
          id={fieldId}
          className={cx(styles.textarea, error && styles.invalid)}
          maxLength={maxLength}
          value={value}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...textarea}
        />
        {maxLength ? <span className={styles.counter}>{length} / {maxLength}</span> : null}
      </div>
    </FieldShell>
  );
}

export interface PinCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "children"> {
  children: ReactNode;
  className?: string;
}

/** Case à cocher dessinée en pin (cavité, puis dôme doré). */
export function PinCheckbox({ children, className, checked, disabled, ...input }: PinCheckboxProps) {
  return (
    <label className={cx(styles.check, disabled && styles.checkDisabled, className)}>
      <input type="checkbox" checked={checked} disabled={disabled} {...input} />
      <Pin on={!!checked} className={styles.pinSlot} />
      <span>{children}</span>
    </label>
  );
}
