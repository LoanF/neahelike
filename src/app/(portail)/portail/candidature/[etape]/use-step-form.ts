"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { StepValues } from "@/db/schema";
import type { DataStepId, FieldErrors } from "@/lib/application";
import { autosaveDossier, sendDossier } from "../../dossier/actions";
import { autosaveWipeStep, submitWipeStep } from "../../wipe/actions";
import { autosaveStep, submitStep } from "../actions";

/**
 * Où vont les réponses : la candidature, un dossier de reprise déposé à part, ou un wipe de personnage.
 * Les mêmes formulaires d'étape servent aux trois.
 */
const CHANNELS = {
  candidature: { autosave: autosaveStep, submit: submitStep },
  dossier: { autosave: autosaveDossier, submit: sendDossier },
  wipe: { autosave: autosaveWipeStep, submit: submitWipeStep },
};

export type StepChannel = keyof typeof CHANNELS;

export type SaveState = "idle" | "pending" | "saved" | "error";

/** Délai après la dernière frappe avant l'enregistrement automatique. */
const AUTOSAVE_DELAY = 1200;

/**
 * État d'un formulaire d'étape : enregistrement automatique du brouillon pendant la saisie,
 * validation par le serveur au clic sur « Suivant ».
 */
export function useStepForm(step: DataStepId, initial: StepValues, channel: StepChannel = "candidature") {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [save, setSave] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();
  const latest = useRef(initial);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    if (!dirty.current) return true;
    dirty.current = false;
    setSave("pending");
    try {
      const result = await CHANNELS[channel].autosave(step, latest.current);
      if ("error" in result) throw new Error(result.error);
      setSave("saved");
      setSavedAt(new Date());
      return true;
    } catch {
      dirty.current = true;
      setSave("error");
      return false;
    }
  }, [step, channel]);

  const set = useCallback(
    (field: string, value: string | boolean | null) => {
      latest.current = { ...latest.current, [field]: value };
      setValues(latest.current);
      setErrors(current => {
        if (!(field in current)) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
      dirty.current = true;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), AUTOSAVE_DELAY);
    },
    [flush],
  );

  // Fermeture de l'onglet : dernière tentative d'enregistrement.
  useEffect(() => {
    const onLeave = () => {
      if (dirty.current) void flush();
    };
    window.addEventListener("pagehide", onLeave);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      window.clearTimeout(timer.current);
    };
  }, [flush]);

  const submit = () =>
    startTransition(async () => {
      window.clearTimeout(timer.current);
      dirty.current = false;
      const result = await CHANNELS[channel].submit(step, latest.current);
      if ("errors" in result) {
        setErrors(result.errors);
        setSave("saved");
        setSavedAt(new Date());
        // Amène le premier champ en erreur à l'écran.
        requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true'], [data-invalid='true']")?.focus());
        return;
      }
      router.push(result.next);
    });

  const goTo = (href: string) =>
    startTransition(async () => {
      await flush();
      router.push(href);
    });

  return { values, set, errors, save, savedAt, pending, submit, goTo };
}

export type StepForm = ReturnType<typeof useStepForm>;

export function text(values: StepValues, field: string) {
  const value = values[field];
  return typeof value === "string" ? value : "";
}
