"use client";

import type { FormEvent } from "react";
import { startTransition, useActionState } from "react";

/**
 * `useActionState` branché sur `onSubmit` plutôt que sur `<form action>`. Avec `action`, React vide le
 * formulaire après chaque envoi : en cas d'erreur, les cases et les textes s'effacent à l'écran mais restent
 * cochés dans l'état du composant (il faut recliquer deux fois, et le texte saisi est perdu). Ici rien n'est vidé.
 * Renvoie `[état, onSubmit, envoi en cours]`.
 */
export function useActionForm<State>(action: (state: Awaited<State>, data: FormData) => State | Promise<State>, initial: Awaited<State>) {
  const [state, dispatch, pending] = useActionState<State, FormData>(action, initial);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    startTransition(() => dispatch(data));
  };
  return [state, onSubmit, pending] as const;
}
