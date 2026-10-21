import { ArrowUpRight, BookOpen, HelpCircle, MessageCircle, Scale } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, ButtonLink, cx, DotsRow, Pin, Plaque } from "@/components/plaque";
import { formatDate, journeyIndex, STATUS_LABEL, STATUS_TONE } from "@/components/portal/application-status";
import { PortalHeader } from "@/components/portal/shell";
import { JOURNEY } from "@/content/candidature";
import { criterionLabel } from "@/content/staff";
import { SITE } from "@/content/site";
import type { Application } from "@/db/schema";
import { currentStep, isStepComplete, stepHref, visibleSteps } from "@/lib/application";
import type { StartBlock } from "@/lib/applications";
import { getLatestApplication, getOpenApplication, getStartBlock } from "@/lib/applications";
import { displayName } from "@/lib/discord-cdn";
import { requireUser } from "@/lib/session";
import { startCandidature } from "./candidature/actions";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Tableau de bord" };

const RESOURCES = [
  { href: "/lore", label: "Lore", text: "Les dieux, les affinités, les créatures et l'histoire de la cité.", icon: BookOpen },
  { href: "/reglement", label: "Règlement", text: "Les règles du serveur, à connaître avant l'entretien.", icon: Scale },
  { href: "/faq", label: "FAQ", text: "Les réponses aux questions les plus fréquentes.", icon: HelpCircle },
];

export default async function PortailPage() {
  const user = await requireUser();
  const [open, latest] = await Promise.all([getOpenApplication(user.id), getLatestApplication(user.id)]);
  const application = open ?? latest;
  const block = open ? null : await getStartBlock(user.id);
  const journey = journeyIndex(application?.status ?? null);

  return (
    <>
      <PortalHeader eyebrow="Tableau de bord" title={`Bienvenue, ${displayName(user)}`}>
        Suis ta candidature et garde le lore et le règlement à portée de main.
      </PortalHeader>

      <div className={styles.grid}>
        <Plaque unveil className={styles.main}>
          <DotsRow className={styles.dots} />
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Ma candidature</h2>
            {application && !block?.reason && <Badge tone={STATUS_TONE[application.status]} size="lg">{STATUS_LABEL[application.status]}</Badge>}
          </div>
          <ApplicationState application={open} latest={latest} block={block} />
        </Plaque>

        <Plaque unveil className={styles.journey}>
          <DotsRow className={styles.dots} />
          <h2 className={styles.cardTitle}>Ton parcours</h2>
          <ol className={styles.journeyList}>
            {JOURNEY.map((step, index) => {
              const done = index < journey || application?.status === "whitelistee";
              const current = index === journey && !done;
              return (
                <li key={step.title} className={cx(styles.journeyStep, current && styles.journeyCurrent, done && styles.journeyDone)}>
                  <Pin on={done || current} />
                  <div>
                    <span className={styles.journeyTitle}>{step.title}</span>
                    <p className={styles.journeyText}>{step.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Plaque>
      </div>

      <section className={styles.resources} aria-labelledby="ressources">
        <h2 id="ressources" className={styles.sectionTitle}>Ressources</h2>
        <div className={styles.resourceGrid}>
          {RESOURCES.map(resource => {
            const Icon = resource.icon;
            return (
              <Plaque key={resource.href} as={Link} href={resource.href} target="_blank" interactive rivets="none" className={styles.resource}>
                <Icon size={22} className={styles.resourceIcon} aria-hidden="true" />
                <span className={styles.resourceLabel}>{resource.label}</span>
                <span className={styles.resourceText}>{resource.text}</span>
              </Plaque>
            );
          })}
          <Plaque as="a" href={SITE.discordUrl} target="_blank" rel="noreferrer" interactive rivets="none" className={styles.resource}>
            <MessageCircle size={22} className={styles.resourceIcon} aria-hidden="true" />
            <span className={styles.resourceLabel}>
              Discord <ArrowUpRight size={14} aria-hidden="true" />
            </span>
            <span className={styles.resourceText}>Les annonces, l&apos;entretien vocal et l&apos;aide de l&apos;équipe.</span>
          </Plaque>
        </div>
      </section>
    </>
  );
}

function Progress({ application }: { application: Application }) {
  const steps = visibleSteps(application).flatMap(step => (step.id === "recapitulatif" ? [] : [step.id]));
  const done = steps.filter(step => isStepComplete(application, step)).length;
  return (
    <div className={styles.progress}>
      <div className={styles.progressBar} aria-hidden="true">
        <span style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <span className={styles.progressText}>
        {done} étape{done > 1 ? "s" : ""} sur {steps.length} remplie{done > 1 ? "s" : ""}
      </span>
    </div>
  );
}

function ApplicationState({ application, latest, block }: { application: Application | null; latest: Application | null; block: StartBlock }) {
  if (block?.reason === "whitelistee") {
    return <p className={styles.stateText}>Ta whitelist est validée. Bienvenue parmi les citoyens de Néa Hélikè.</p>;
  }

  if (!application) {
    const refused = latest?.status === "refusee" ? latest : null;
    return (
      <>
        {refused && (refused.refusalCriteria?.length || refused.refusalComment) ? (
          <div className={styles.refusal}>
            {!!refused.refusalCriteria?.length && (
              <ul>
                {refused.refusalCriteria.map(id => (
                  <li key={id}>{criterionLabel(id)}</li>
                ))}
              </ul>
            )}
            {refused.refusalComment && <p className={styles.quote}>« {refused.refusalComment} »</p>}
          </div>
        ) : null}
        <p className={styles.stateText}>
          {block?.reason === "delai"
            ? `Ta dernière candidature a été refusée. Tu pourras en déposer une nouvelle à partir du ${formatDate(block.until)}.`
            : latest?.status === "refusee"
              ? "Ta dernière candidature a été refusée, mais le délai est passé : tu peux en déposer une nouvelle."
              : "Tu n'as pas encore commencé ta candidature. Compte une trentaine de minutes, et prévois le lien de ton background."}
        </p>
        {block?.reason !== "delai" && (
          <form action={startCandidature} className={styles.cta}>
            <Button type="submit" size="lg">Commencer ma candidature</Button>
          </form>
        )}
      </>
    );
  }

  switch (application.status) {
    case "brouillon":
      return (
        <>
          <Progress application={application} />
          <p className={styles.stateText}>Ta candidature est enregistrée au fur et à mesure. Reprends là où tu t&apos;étais arrêté.</p>
          <div className={styles.cta}>
            <ButtonLink href={stepHref(currentStep(application))} size="lg">Reprendre ma candidature</ButtonLink>
          </div>
        </>
      );
    case "a_modifier":
      return (
        <>
          <p className={styles.stateText}>L&apos;équipe te demande de modifier une partie de ta candidature avant de la relire.</p>
          {application.changesComment && <p className={styles.quote}>« {application.changesComment} »</p>}
          <div className={styles.cta}>
            <ButtonLink href="/portail/candidature" size="lg">Voir les modifications</ButtonLink>
          </div>
        </>
      );
    case "envoyee":
      return (
        <>
          <p className={styles.stateText}>
            Envoyée le {formatDate(application.submittedAt ?? application.updatedAt)}. Un recruteur va la lire : tu seras prévenu sur Discord et ici.
          </p>
          <div className={styles.cta}>
            <ButtonLink href="/portail/candidature" variant="secondary" size="lg">Relire ma candidature</ButtonLink>
          </div>
        </>
      );
    case "entretien":
      return (
        <p className={styles.stateText}>
          Ta candidature écrite est validée. Rejoins un salon d&apos;attente sur le Discord pour passer ton entretien vocal.
        </p>
      );
    default:
      return null;
  }
}
