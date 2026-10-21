import { ExternalLink, PencilLine } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AFFINITIES, CREATURES } from "@/content/lore";
import type { Application, StepValues, User } from "@/db/schema";
import type { DataStepId } from "@/lib/application";
import { dossierTargetLabel, isStepEditable, stepHref, wantsDossier } from "@/lib/application";
import styles from "./candidature.module.css";

function value(values: StepValues | null, field: string) {
  const raw = values?.[field];
  return typeof raw === "string" ? raw.trim() : "";
}

function Section({ title, step, editable, children }: { title: string; step: DataStepId; editable: boolean; children: ReactNode }) {
  return (
    <section className={styles.recapSection} aria-labelledby={`recap-${step}`}>
      <div className={styles.recapHead}>
        <h3 id={`recap-${step}`} className={styles.recapTitle}>{title}</h3>
        {editable && (
          <Link href={stepHref(step)} className={styles.recapEdit}>
            <PencilLine size={15} aria-hidden="true" /> Modifier
          </Link>
        )}
      </div>
      <dl className={styles.recapList}>{children}</dl>
    </section>
  );
}

function Item({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? styles.recapWide : undefined}>
      <dt>{label}</dt>
      <dd>{children || <span className={styles.recapEmpty}>Non renseigné</span>}</dd>
    </div>
  );
}

function DocLink({ href }: { href: string }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={styles.recapLink}>
      {href.replace(/^https:\/\//, "").slice(0, 60)}
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}

/** Relecture de la candidature : récapitulatif avant envoi, ou lecture seule une fois envoyée. */
export function ApplicationRecap({ application, user, editable }: { application: Application; user: Pick<User, "id" | "username">; editable: boolean }) {
  const { hrp, rp, background, dossier } = application;
  const affinity = AFFINITIES.find(item => item.id === value(rp, "affinity"));
  const creature = CREATURES.find(item => item.id === value(rp, "creature"));

  return (
    <div className={styles.recap}>
      {wantsDossier(application) && (
        <p className={styles.recapBanner}>
          Dossier de reprise : <strong>{dossierTargetLabel(dossier) ?? "à compléter"}</strong>
        </p>
      )}

      <Section title="HRP" step="hrp" editable={editable && isStepEditable(application, "hrp")}>
        <Item label="Pseudo Discord">@{user.username}</Item>
        <Item label="ID Discord">{user.id}</Item>
        <Item label="Âge">{value(hrp, "age") && `${value(hrp, "age")} ans`}</Item>
        <Item label="Heures de RP">{value(hrp, "rpHours") && `${value(hrp, "rpHours")} h`}</Item>
        <Item label="Micro de bonne qualité">{hrp?.goodMic ? "Oui" : "Non"}</Item>
        <Item label="Dossier de reprise">{hrp?.wantsDossier ? "Oui" : "Non"}</Item>
        <Item label="Expériences RP" wide>
          <span className={styles.recapText}>{value(hrp, "experience")}</span>
        </Item>
      </Section>

      <Section title="Personnage" step="rp" editable={editable && isStepEditable(application, "rp")}>
        <Item label="Prénom et nom">{[value(rp, "firstName"), value(rp, "lastName")].filter(Boolean).join(" ")}</Item>
        <Item label="Âge">{value(rp, "age") && `${value(rp, "age")} ans`}</Item>
        <Item label="Affinité">{affinity ? `${affinity.name} (${affinity.god})` : "Aucune"}</Item>
        <Item label="Créature">{creature ? creature.name : "Humain"}</Item>
        <Item label="Origine" wide>
          <span className={styles.recapText}>{value(rp, "origin")}</span>
        </Item>
      </Section>

      <Section title="Background" step="background" editable={editable && isStepEditable(application, "background")}>
        <Item label="Document" wide>
          <DocLink href={value(background, "url")} />
        </Item>
      </Section>

      {wantsDossier(application) && (
        <Section title="Dossier de reprise" step="dossier" editable={editable && isStepEditable(application, "dossier")}>
          <Item label="Reprise">{dossierTargetLabel(dossier)}</Item>
          <Item label="Document">
            <DocLink href={value(dossier, "url")} />
          </Item>
        </Section>
      )}
    </div>
  );
}
