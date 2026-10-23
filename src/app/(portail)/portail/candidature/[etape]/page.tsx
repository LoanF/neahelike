import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import type { StepId } from "@/lib/application";
import { canAccessStep, currentStep, isStepId, previousStep, STEPS, stepHref, visibleSteps } from "@/lib/application";
import { getOpenApplication, isEditable } from "@/lib/applications";
import { getBusinesses, takeoverNames } from "@/lib/businesses";
import { getFactions } from "@/lib/factions";
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
import { RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { SendForm } from "./send-form";

export const metadata: Metadata = { title: "Candidature" };


/** Erreurs d'envoi, par code (l'adresse ne transporte jamais de texte libre). */
const SEND_ERRORS: Record<string, string> = {
  certify: "Coche la case de certification pour envoyer ta candidature.",
  limite: RATE_LIMIT_MESSAGE,
  envoi: "Ta candidature ne peut pas être envoyée : vérifie que toutes les étapes sont complètes et que tes choix (affinité, créature, reprise) sont toujours ouverts.",
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
  const [{ affinities: affinityList, creatures: creatureList }, businessList, names] = await Promise.all([getFactions(), getBusinesses(), takeoverNames()]);
  const affinityChoice = (item: (typeof affinityList)[number]) => ({ id: item.id, name: item.name, meta: `${item.god} · ${item.element}`, emblem: item.emblem });
  const creatureChoice = (item: (typeof creatureList)[number]) => ({ id: item.id, name: item.name, meta: item.originShort, emblem: item.emblem });
  // Rejoindre : « places closes ». Reprendre un lead ou une entreprise : « déjà repris ».
  const affinities: Choice[] = affinityList.map(item => ({ ...affinityChoice(item), closed: !item.joinOpen }));
  const creatures: Choice[] = creatureList.map(item => ({ ...creatureChoice(item), closed: !item.joinOpen }));
  const leads = {
    affinite: affinityList.map(item => ({ ...affinityChoice(item), closed: !item.leadOpen })),
    creature: creatureList.map(item => ({ ...creatureChoice(item), closed: !item.leadOpen })),
    entreprise: businessList.map(item => ({ id: item.id, name: item.name, meta: item.description, emblem: "coin" as const, closed: !item.open })),
  };

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
            leads={leads}
            names={names}
            error={erreur && Object.hasOwn(SEND_ERRORS, erreur) ? SEND_ERRORS[erreur] : undefined}
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
  leads: { affinite: Choice[]; creature: Choice[]; entreprise: Choice[] };
  names: Record<string, string>;
  error?: string;
}

function StepContent({ step, application, user, backHref, affinities, creatures, leads, names, error }: StepContentProps) {
  switch (step) {
    case "hrp":
      return <HrpForm initial={application.hrp ?? {}} discord={{ username: user.username, id: user.id }} />;
    case "rp":
      return <RpForm initial={application.rp ?? {}} affinities={affinities} creatures={creatures} backHref={backHref} />;
    case "background":
      return <BackgroundForm initial={application.background ?? {}} backHref={backHref} />;
    case "dossier":
      return <DossierForm initial={application.dossier ?? {}} leads={leads} backHref={backHref} />;
    case "recapitulatif":
      return (
        <>
          <p className={styles.intro}>Relis tout avant d&apos;envoyer. Tu peux encore modifier chaque partie.</p>
          <ApplicationRecap application={application} user={user} names={names} editable />
          {error && <p className={styles.formError} role="alert">{error}</p>}
          <SendForm />
        </>
      );
  }
}
