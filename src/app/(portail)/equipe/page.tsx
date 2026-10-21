import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cx } from "@/components/plaque";
import { RANK_LABEL } from "@/components/portal/profile-card";
import { PortalHeader } from "@/components/portal/shell";
import type { TabId } from "@/components/equipe/badges";
import { TABS } from "@/components/equipe/badges";
import { dossierTargetLabel, wantsDossier } from "@/lib/application";
import { displayName } from "@/lib/discord-cdn";
import { requireUser } from "@/lib/session";
import { listPlayers, presenceFor } from "@/lib/team";
import { takeoverNames } from "@/lib/businesses";
import styles from "./equipe.module.css";
import type { PlayerListRow } from "./player-list";
import { PlayerList } from "./player-list";

export const metadata: Metadata = { title: "Joueurs" };

const shortDate = (date: Date) => date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });

export default async function EquipePage({ searchParams }: { searchParams: Promise<{ onglet?: string; q?: string; supprime?: string; avertissement?: string | string[] }> }) {
  const { onglet, q, supprime, avertissement } = await searchParams;
  const viewer = await requireUser({ rank: "recruteur" });
  const tab = (TABS.find(item => item.id === onglet)?.id ?? "a-traiter") as TabId;
  const query = q?.trim().slice(0, 80) ?? "";
  const { rows, counts } = await listPlayers({ tab, query });
  const [presence, names] = await Promise.all([presenceFor(rows.map(row => row.user.id), viewer.id), takeoverNames()]);

  const list: PlayerListRow[] = rows.map(({ user, application, badge }) => {
    const rp = application?.rp;
    const rpName = [rp?.firstName, rp?.lastName].filter(value => typeof value === "string" && value.trim()).join(" ");
    const date = application?.submittedAt ?? application?.updatedAt ?? null;
    return {
      id: user.id,
      name: displayName(user),
      username: user.username,
      avatar: user.avatar,
      rankLabel: user.rank === "joueur" ? null : RANK_LABEL[user.rank],
      rpName: rpName || null,
      badge,
      dossier: application && wantsDossier(application) ? (dossierTargetLabel(application.dossier, names) ?? "Dossier en cours") : null,
      date: date ? shortDate(date) : null,
      inGuild: user.inGuild,
    };
  });

  const href = (id: string) => `/equipe?onglet=${id}${query ? `&q=${encodeURIComponent(query)}` : ""}`;

  return (
    <>
      <PortalHeader eyebrow="Espace équipe" title="Joueurs">
        Les candidatures à lire, les entretiens à faire passer et tous les comptes liés au portail.
      </PortalHeader>
      <div className={styles.page}>
        {supprime && (
          <p className={styles.notice} role="status">
            Compte supprimé.
            {avertissement && (
              <span className={styles.noticeWarnings}>
                À vérifier sur Discord : {[avertissement].flat().map(item => item.slice(0, 120)).join(" · ")}
              </span>
            )}
          </p>
        )}
        <div className={styles.toolbar}>
          <nav className={styles.tabs} aria-label="Filtrer les joueurs">
            {TABS.map(item => (
              <Link key={item.id} href={href(item.id)} className={cx(styles.tab, item.id === tab && styles.tabActive)} aria-current={item.id === tab ? "page" : undefined}>
                {item.label}
                <span className={styles.count}>{counts[item.id]}</span>
              </Link>
            ))}
          </nav>
          <form className={styles.search} role="search">
            <input type="hidden" name="onglet" value={tab} />
            <Search size={16} aria-hidden="true" className={styles.searchIcon} />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="ID Discord, pseudo, prénom ou nom RP"
              aria-label="Rechercher un joueur"
              className={styles.searchInput}
            />
          </form>
        </div>
        <PlayerList rows={list} initialPresence={presence} />
      </div>
    </>
  );
}
