import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Badge, Button, DotsRow, Plaque } from "@/components/plaque";
import { formatDate, STATUS_LABEL, STATUS_TONE } from "@/components/portal/application-status";
import { PortalHeader } from "@/components/portal/shell";
import { CANDIDATURE_INTRO } from "@/content/candidature";
import { currentStep, STEPS, stepHref } from "@/lib/application";
import { getOpenApplication, getStartBlock, isEditable } from "@/lib/applications";
import { takeoverNames } from "@/lib/businesses";
import { requireUser } from "@/lib/session";
import { startCandidature } from "./actions";
import styles from "./candidature.module.css";
import { ApplicationRecap } from "./recap";

export const metadata: Metadata = { title: "Candidature" };

export default async function CandidaturePage({ searchParams }: { searchParams: Promise<{ erreur?: string; envoyee?: string }> }) {
  const { erreur, envoyee } = await searchParams;
  const user = await requireUser();
  const open = await getOpenApplication(user.id);

  // Brouillon : on reprend directement à la bonne étape.
  if (open && isEditable(open)) redirect(stepHref(currentStep(open)));

  if (open) {
    return (
      <>
        <PortalHeader
          eyebrow="Candidature"
          title="Ma candidature"
          actions={<Badge tone={STATUS_TONE[open.status]} size="lg">{STATUS_LABEL[open.status]}</Badge>}
        >
          Envoyée le {formatDate(open.submittedAt ?? open.updatedAt)}. Elle n&apos;est plus modifiable, sauf si l&apos;équipe te le demande.
        </PortalHeader>
        <div className={styles.single}>
          {envoyee && (
            <p className={styles.success} role="status">
              Ta candidature est envoyée. Tu seras prévenu sur Discord et sur ce portail dès qu&apos;un recruteur l&apos;aura lue.
            </p>
          )}
          <Plaque className={styles.panel}>
            <DotsRow className={styles.dots} />
            <ApplicationRecap application={open} user={user} names={await takeoverNames()} editable={false} />
          </Plaque>
        </div>
      </>
    );
  }

  const block = await getStartBlock(user.id);

  return (
    <>
      <PortalHeader eyebrow="Candidature" title="Rejoindre la cité">{CANDIDATURE_INTRO}</PortalHeader>
      <div className={styles.single}>
        <Plaque unveil className={styles.panel}>
          <DotsRow className={styles.dots} />
          {block?.reason === "whitelistee" ? (
            <p className={styles.intro}>Ta whitelist est déjà validée : tu n&apos;as plus de candidature à remplir.</p>
          ) : block?.reason === "delai" ? (
            <p className={styles.intro}>Ta dernière candidature a été refusée. Tu pourras en déposer une nouvelle à partir du {formatDate(block.until)}.</p>
          ) : (
            <>
              <ol className={styles.overview}>
                {STEPS.map((step, index) => (
                  <li key={step.id}>
                    <span className={styles.overviewNumber}>{index + 1}</span>
                    <span>
                      <strong>{step.label}</strong>
                      {step.id === "dossier" && <span className={styles.optional}> (facultatif)</span>}
                    </span>
                  </li>
                ))}
              </ol>
              {erreur && <p className={styles.formError} role="alert">{erreur}</p>}
              <form action={startCandidature} className={styles.start}>
                <Button type="submit" size="lg">Commencer ma candidature</Button>
              </form>
            </>
          )}
        </Plaque>
      </div>
    </>
  );
}
