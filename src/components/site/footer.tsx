import Link from "next/link";
import { Logo } from "@/components/plaque";
import { FOOTER_COLUMNS, LEGAL_LINKS, SITE } from "@/content/site";
import styles from "./footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <Logo size={64} ring={2} />
          <div>
            <p className={styles.name}>{SITE.name}</p>
            <p className={styles.desc}>Serveur roleplay FiveM en whitelist, dans l&apos;univers de la mythologie grecque.</p>
          </div>
        </div>
        {FOOTER_COLUMNS.map(column => (
          <div key={column.title} className={styles.column}>
            <p className={styles.title}>{column.title}</p>
            {column.links.map(link => (
              <Link key={link.label} href={link.href} className={styles.link}>{link.label}</Link>
            ))}
          </div>
        ))}
        <div className={styles.column}>
          <p className={styles.title}>Communauté</p>
          <a href={SITE.discordUrl} target="_blank" rel="noreferrer" className={styles.link}>Discord</a>
          <p className={styles.note}>Annonces, recrutement, entretiens vocaux.</p>
        </div>
      </div>
      <div className={styles.legal}>
        <p>© {new Date().getFullYear()} {SITE.name}. Projet communautaire, sans lien avec Rockstar Games.</p>
        <nav className={styles.legalLinks} aria-label="Liens légaux">
          {LEGAL_LINKS.map(link => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
