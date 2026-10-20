"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";
import styles from "./lore.module.css";

export interface LoreTab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Onglets du lore, synchronisés avec l'ancre de l'URL :
 * `/lore#creatures` ouvre l'onglet, `/lore#creatures-minotaures` ouvre l'onglet puis descend jusqu'à la fiche.
 */
export function LoreTabs({ tabs }: { tabs: LoreTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const ids = new Set(tabs.map(tab => tab.id));
    function readHash() {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) return;
      const tab = hash.split("-")[0];
      if (!ids.has(tab)) return;
      setActive(tab);
      setTarget(hash);
    }
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [tabs]);

  // Une fois le bon panneau affiché, descendre jusqu'à la fiche demandée.
  useEffect(() => {
    if (!target) return;
    const timer = window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTarget(null);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [target, active]);

  function change(next: string) {
    setActive(next);
    history.replaceState(null, "", `#${next}`);
  }

  return (
    <Tabs value={active} onValueChange={change} className={styles.tabs}>
      <div className={styles.tabBar}>
        <TabsList aria-label="Chapitres du lore">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id} className={styles.panel}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
