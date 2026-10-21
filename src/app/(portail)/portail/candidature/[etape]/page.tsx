import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { AFFINITY_AVAILABILITY, CREATURE_AVAILABILITY } from "@/content/availability";
import { AFFINITIES, CREATURES } from "@/content/lore";
import type { StepId } from "@/lib/application";
import { canAccessStep, currentStep, isStepId, previousStep, STEPS, stepHref, visibleSteps } from "@/lib/application";
import { getOpenApplication, isEditable } from "@/lib/applications";
import { requireUser } from "@/lib/session";
import { ChangesNotice } from "../changes-notice";
import { ApplicationRecap } from "../recap";
import { Stepper } from "../stepper";
import styles from "../candidature.module.css";
import { BackgroundForm } from "./background-form";
import type { Choice } from "./choice-grid";
import { DossierForm } from "./dossier-form";
import { HrpForm } from "./hrp-form";
import { RpForm } from "./rp-form";
import { SendForm } from "./send-form";

export const metadata: Metadata = { title: "Candidature" };

const AFFINITY_CHOICES: Choice[] = AFFINITIES.map(item => ({ id: item.id, name: item.name, meta: `${item.god} · ${item.element}`, emblem: item.emblem }));
const CREATURE_CHOICES: Choice[] = CREATURES.map(item => ({ id: item.id, name: item.name, meta: item.originShort, emblem: item.emblem }));

const SEND_ERRORS: Record<string, string> = {
  certify: "Coche la case de certification pour envoyer ta candidature.",
};

export default async function StepPage({ params, searchParams }: { params: Promise<{ etape: string }>; searchParams: Promise<{ erreur?: string }> }) {
  const [{ etape }, { erreur }] = await Promise.all([params, searchParams]);
  if (!isStepId(etape)) notFound();

  const user = await requireUser();
  const application = await getOpenApplication(user.id);
  if (!application || !isEditable(application)) redirect("/portail/candidature");
  if (!canAccessStep(application, etape)) redirect(stepHref(currentStep(application)));

  const step = STEPS.find(item => item.id === etape)!;
  const steps = visibleSteps(application);
  const index = steps.findIndex(item => item.id === etape);
  const previous = previousStep(application, etape);
  const backHref = previous ? stepHref(previous) : undefined;

  // Places closes : lues côté serveur à chaque affichage.
  const affinities = AFFINITY_CHOICES.map(choice => ({ ...choice, closed: AFFINITY_AVAILABILITY[choice.id as keyof typeof AFFINITY_AVAILABILITY] === false }));
  const creatures = CREATURE_CHOICES.map(choice => ({ ...choice, closed: CREATURE_AVAILABILITY[choice.id as keyof typeof CREATURE_AVAILABILITY] === false }));

  return (
    <>
      <PortalHeader eyebrow={`Candidature · étape ${index + 1} sur ${steps.length}`} title={step.title} />
      <div className={styles.layout}>
        <Stepper application={application} current={etape} />
        {application.status === "a_modifier" && <ChangesNotice steps={application.changesSteps ?? []} comment={application.changesComment} />}
        <Plaque unveil className={styles.panel}>
          <DotsRow className={styles.dots} />
          <StepContent
            step={etape}
            application={application}
            user={user}
            backHref={backHref}
            affinities={affinities}
            creatures={creatures}
            error={erreur ? (SEND_ERRORS[erreur] ?? erreur) : undefined}
          />
        </Plaque>
      </div>
    </>
  );
}

interface StepContentProps {
  step: StepId;
  application: NonNullable<Awaited<ReturnType<typeof getOpenApplication>>>;
  user: { id: string; username: string };
  backHref?: string;
  affinities: Choice[];
  creatures: Choice[];
  error?: string;
}

function StepContent({ step, application, user, backHref, affinities, creatures, error }: StepContentProps) {
  switch (step) {
    case "hrp":
      return <HrpForm initial={application.hrp ?? {}} discord={{ username: user.username, id: user.id }} />;
    case "rp":
      return <RpForm initial={application.rp ?? {}} affinities={affinities} creatures={creatures} backHref={backHref} />;
    case "background":
      return <BackgroundForm initial={application.background ?? {}} backHref={backHref} />;
    case "dossier":
      return <DossierForm initial={application.dossier ?? {}} affinities={affinities.map(choice => ({ ...choice, closed: false }))} creatures={creatures.map(choice => ({ ...choice, closed: false }))} backHref={backHref} />;
    case "recapitulatif":
      return (
        <>
          <p className={styles.intro}>Relis tout avant d&apos;envoyer. Tu peux encore modifier chaque partie.</p>
          <ApplicationRecap application={application} user={user} editable />
          {error && <p className={styles.formError} role="alert">{error}</p>}
          <SendForm />
        </>
      );
  }
}
