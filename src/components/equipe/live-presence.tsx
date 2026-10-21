"use client";

import { useEffect, useState } from "react";
import { heartbeat, leaveProfile } from "@/app/(portail)/equipe/actions";
import type { Viewer } from "@/lib/team";
import { PresenceEye } from "./presence-eye";

const HEARTBEAT_MS = 10_000;

/** Sur une fiche : signale sa présence toutes les 10 s et affiche les autres lecteurs. */
export function ProfilePresence({ subjectId }: { subjectId: string }) {
  const [viewers, setViewers] = useState<Viewer[]>([]);

  useEffect(() => {
    let active = true;
    const beat = () => {
      if (document.visibilityState !== "visible") return;
      heartbeat(subjectId).then(list => active && setViewers(list), () => {});
    };
    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
      void leaveProfile(subjectId).catch(() => {});
    };
  }, [subjectId]);

  return <PresenceEye viewers={viewers} size={26} />;
}
