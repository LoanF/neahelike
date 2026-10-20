import Link from "next/link";
import type { ReactNode } from "react";
import { cx, DotsRow, Spiral } from "@/components/plaque";
import { Emblem } from "./emblem";
import type { EmblemName } from "./emblem";
import styles from "./section.module.css";

/** Section de page : conteneur 1440 px et écart de 110 px au-dessus. */
export function Section({ id, first, className, children }: { id?: string; first?: boolean; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cx(styles.section, first && styles.first, className)}>
      {children}
    </section>
  );
}

/** En-tête de section : titre Marcellus 44 px, sous-titre en dim, lien optionnel à droite. */
export function SectionHead({ title, sub, link, as: Tag = "h2" }: { title: ReactNode; sub?: ReactNode; link?: { href: string; label: string }; as?: "h1" | "h2" | "h3" }) {
  return (
    <div className={styles.head}>
      <div className={styles.headText}>
        <Tag className={styles.title}>{title}</Tag>
        {sub && <p className={styles.sub}>{sub}</p>}
      </div>
      {link && <Link href={link.href} className={styles.headLink}>{link.label}</Link>}
    </div>
  );
}

/** Emblème gravé dans une cavité carrée (le cercle reste réservé aux rivets et aux pins). */
export function EmblemSocket({ name, size = 48, className }: { name: EmblemName; size?: number; className?: string }) {
  return (
    <span className={cx(styles.socket, className)} style={{ width: size, height: size }}>
      <Emblem name={name} size={Math.round(size * .5)} />
    </span>
  );
}

/** En-tête des pages intérieures (Lore, Règlement, FAQ) : bandeau « scène », titre et accroche. */
export function PageIntro({ title, lead, children }: { title: string; lead: ReactNode; children?: ReactNode }) {
  return (
    <div className={styles.intro}>
      <div className={styles.introInner}>
        <DotsRow width={220} />
        <div className={styles.introTitleRow}>
          <h1 className={styles.introTitle}>{title}</h1>
          <Spiral />
        </div>
        <p className={styles.introLead}>{lead}</p>
        {children}
      </div>
    </div>
  );
}
