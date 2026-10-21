"use client";

import { BarChart3, BookOpen, Briefcase, FileStack, HelpCircle, History, KeyRound, LayoutDashboard, ListX, Menu, Scale, ScrollText, Sparkles, UserRound, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Rank } from "@/db/schema";
import { cx } from "@/components/plaque";
import styles from "./shell.module.css";

const PORTAL_LINKS = [
  { href: "/portail", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/portail/candidature", label: "Candidature", icon: ScrollText },
  { href: "/portail/dossier", label: "Dossier de reprise", icon: FileStack },
  { href: "/portail/compte", label: "Mon compte", icon: UserRound },
];

// « Joueurs » reste sélectionné sur les fiches (/equipe/joueurs/…), pas sur les pages d'administration.
const TEAM_LINKS = [{ href: "/equipe", label: "Joueurs", icon: Users, exact: true, also: "/equipe/joueurs/" }];

/** Administration : réservée aux admins ; les rôles et permissions aux owners. */
const ADMIN_LINKS = [
  { href: "/equipe/factions", label: "Affinités et créatures", icon: Sparkles },
  { href: "/equipe/reprises", label: "Entreprises", icon: Briefcase },
  { href: "/equipe/criteres", label: "Critères de refus", icon: ListX },
  { href: "/equipe/journal", label: "Journal", icon: History },
  { href: "/equipe/statistiques", label: "Statistiques", icon: BarChart3 },
];

const OWNER_LINKS = [{ href: "/equipe/roles", label: "Rôles et permissions", icon: KeyRound }];

const RANK_WEIGHT: Record<Rank, number> = { joueur: 0, recruteur: 1, admin: 2, owner: 3 };

type NavLink = { href: string; label: string; icon: typeof Users; exact?: boolean; also?: string };

const CITY_LINKS = [
  { href: "/lore", label: "Lore", icon: BookOpen },
  { href: "/reglement", label: "Règlement", icon: Scale },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
];

/** Navigation latérale du portail ; tiroir sous 900 px. `footer` = carte du joueur et déconnexion. */
export function ShellNav({ footer, rank }: { footer: ReactNode; rank: Rank }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const weight = RANK_WEIGHT[rank];

  const section = (title: string, links: NavLink[]) => (
    <>
      <span className={styles.navTitle}>{title}</span>
      {links.map(link => {
        const current =
          (link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`)) || (!!link.also && pathname.startsWith(link.also));
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href} className={cx(styles.navLink, current && styles.navCurrent)} aria-current={current ? "page" : undefined}>
            <Icon size={18} aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </>
  );

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        type="button"
        className={styles.burger}
        aria-expanded={open}
        aria-controls="nh-portal-nav"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOpen(value => !value)}
      >
        {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      <div id="nh-portal-nav" className={cx(styles.navPanel, open && styles.navOpen)}>
        <nav aria-label="Portail" className={styles.nav}>
          <span className={styles.navTitle}>Mon portail</span>
          {PORTAL_LINKS.map(link => {
            const current = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className={cx(styles.navLink, current && styles.navCurrent)} aria-current={current ? "page" : undefined}>
                <Icon size={18} aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
          {weight >= RANK_WEIGHT.recruteur && section("Équipe", TEAM_LINKS)}
          {weight >= RANK_WEIGHT.admin && section("Administration", [...ADMIN_LINKS, ...(weight >= RANK_WEIGHT.owner ? OWNER_LINKS : [])])}
          <span className={styles.navTitle}>La cité</span>
          {CITY_LINKS.map(link => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className={styles.navLink} target="_blank">
                <Icon size={18} aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        {footer}
      </div>
    </>
  );
}
