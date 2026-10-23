"use client";

import { useEffect, useRef } from "react";

/** Tant que `open` est vrai, la touche Échap appelle `onClose` (menus et tiroirs). */
export function useCloseOnEscape(open: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
}
