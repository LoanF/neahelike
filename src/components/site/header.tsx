"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ButtonLink, cx, Logo } from "@/components/plaque";
import { useCloseOnEscape } from "@/components/use-close-on-escape";
import { NAV_LINKS, SITE } from "@/content/site";
import styles from "./header.module.css";

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const burger = useRef<HTMLButtonElement>(null);

  // Le menu mobile se referme à chaque navigation.
  useEffect(() => setOpen(false), [pathname]);
  useCloseOnEscape(open, () => {
    setOpen(false);
    burger.current?.focus();
  });

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/" className={styles.brand}>
          <Logo size={44} alt="" />
          <span className={styles.brandName}>{SITE.name}</span>
        </Link>

        <nav className={styles.nav} aria-label="Navigation principale">
          {NAV_LINKS.map(link => {
            const current = isCurrent(pathname, link.href);
            return (
              <Link key={link.href} href={link.href} className={cx(styles.navLink, current && styles.navCurrent)} aria-current={current ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <a href={SITE.discordUrl} target="_blank" rel="noreferrer" className={styles.discord}>Discord</a>
          <ButtonLink href={SITE.joinUrl} size="sm" className={styles.join}>Rejoindre la Whitelist</ButtonLink>
          <button
            ref={burger}
            type="button"
            className={styles.burger}
            aria-expanded={open}
            aria-controls="nh-mobile-nav"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen(value => !value)}
          >
            <span className={cx(styles.burgerLines, open && styles.burgerOpen)} aria-hidden="true" />
          </button>
        </div>
      </div>

      {open && (
        <nav id="nh-mobile-nav" className={styles.drawer} aria-label="Navigation mobile">
          {NAV_LINKS.map(link => {
            const current = isCurrent(pathname, link.href);
            return (
              <Link key={link.href} href={link.href} className={cx(styles.drawerLink, current && styles.drawerCurrent)} aria-current={current ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
          <div className={styles.drawerActions}>
            <ButtonLink href={SITE.joinUrl} size="md">Rejoindre la Whitelist</ButtonLink>
            <a href={SITE.discordUrl} target="_blank" rel="noreferrer" className={styles.discord}>Rejoindre le Discord</a>
          </div>
        </nav>
      )}
    </header>
  );
}
