import type { Metadata } from "next";
import { Badge, ButtonLink, DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { DOSSIER_GUIDE, DOSSIER_KINDS } from "@/content/candidature";
import { canAccessStep, dossierTargetLabel, isStepComplete, stepHref, wantsDossier } from "@/lib/application";
import { getOpenApplication, isEditable } from "@/lib/applications";
import { takeoverNames } from "@/lib/businesses";
import { requireUser } from "@/lib/session";
import styles from "../candidature/candidature.module.css";
import { Guide } from "../candidature/[etape]/guide";

export const metadata: Metadata = { title: "Dossier de reprise" };

export default async function DossierPage() {
  const user = await requireUser();
  const application = await getOpenApplication(user.id);
  const wanted = wantsDossier(application);
  const complete = wanted && isStepComplete(application, "dossier");
  const editable = !!application && isEditable(application);

  return (
    <>
      <PortalHeader
        eyebrow="Dossier de reprise"
        title="Reprendre un rôle de la cité"
        actions={wanted && <Badge tone={complete ? "success" : "gold"} size="lg">{complete ? "Dossier complet" : "Dossier à compléter"}</Badge>}
      >
        Une entreprise, ou le lead d&apos;une affinité ou d&apos;une créature : le dossier se dépose avec ta candidature.
      </PortalHeader>
      <div className={styles.single}>
        <Plaque unveil className={styles.panel}>
          <DotsRow className={styles.dots} />
          {wanted ? (
            <>
              <p className={styles.intro}>
                {complete ? (
                  <>Ton dossier porte sur : <strong>{dossierTargetLabel(application?.dossier, await takeoverNames())}</strong>.</>
                ) : (
                  "Tu as demandé à déposer un dossier : il se remplit après le background, juste avant le récapitulatif."
                )}
              </p>
              {editable && (
                <ButtonLink href={canAccessStep(application, "dossier") ? stepHref("dossier") : "/portail/candidature"} size="lg">
                  {complete ? "Modifier mon dossier" : canAccessStep(application, "dossier") ? "Remplir mon dossier" : "Continuer ma candidature"}
                </ButtonLink>
              )}
            </>
          ) : (
            <>
              <ul className={styles.overview}>
                {DOSSIER_KINDS.map((kind, index) => (
                  <li key={kind.id}>
                    <span className={styles.overviewNumber}>{index + 1}</span>
                    <span>
                      <strong>{kind.label}</strong> <span className={styles.optional}>: {kind.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className={styles.intro} style={{ marginTop: 22 }}>
                {editable
                  ? "Pour déposer un dossier, coche la case « dossier de reprise » à l'étape HRP de ta candidature : une étape s'ajoutera."
                  : application
                    ? "Ta candidature est déjà envoyée sans dossier de reprise."
                    : "Commence ta candidature et coche la case « dossier de reprise » à l'étape HRP."}
              </p>
              {editable ? (
                <ButtonLink href={stepHref("hrp")} variant="secondary">Aller à l&apos;étape HRP</ButtonLink>
              ) : !application ? (
                <ButtonLink href="/portail/candidature" variant="secondary">Commencer ma candidature</ButtonLink>
              ) : null}
            </>
          )}
        </Plaque>
        <Guide title="Ce que doit contenir un dossier" intro={DOSSIER_GUIDE.intro} items={DOSSIER_GUIDE.items} />
      </div>
    </>
  );
}
