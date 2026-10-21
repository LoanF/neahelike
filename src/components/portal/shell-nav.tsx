"use client";

import { BookOpen, FileStack, HelpCircle, LayoutDashboard, Menu, Scale, ScrollText, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "@/components/plaque";
import styles from "./shell.module.css";

const PORTAL_LINKS = [
  { href: "/portail", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/portail/candidature", label: "Candidature", icon: ScrollText },
  { href: "/portail/dossier", label: "Dossier de reprise", icon: FileStack },
];

const CITY_LINKS = [
  { href: "/lore", label: "Lore", icon: BookOpen },
  { href: "/reglement", label: "Règlement", icon: Scale },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
];

/** Navigation latérale du portail ; tiroir sous 900 px. `footer` = carte du joueur et déconnexion. */
export function ShellNav({ footer }: { footer: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
