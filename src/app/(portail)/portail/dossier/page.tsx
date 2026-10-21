import type { Metadata } from "next";
import { Badge, ButtonLink, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { DOSSIER_GUIDE } from "@/content/candidature";
import { canAccessStep, dossierTargetLabel, isStepComplete, stepHref, wantsDossier } from "@/lib/application";
import { getOpenApplication, getStartBlock, isEditable } from "@/lib/applications";
import { getBusinesses, takeoverNames } from "@/lib/businesses";
import { getFactions } from "@/lib/factions";
import { requireUser } from "@/lib/session";
import { Guide } from "../candidature/[etape]/guide";
import styles from "./dossier.module.css";
import type { TakeoverSection } from "./takeover-explorer";
import { TakeoverExplorer } from "./takeover-explorer";

export const metadata: Metadata = { title: "Dossier de reprise" };

export default async function DossierPage() {
  const user = await requireUser();
  const [application, block, { affinities, creatures }, businesses, names] = await Promise.all([
    getOpenApplication(user.id),
    getStartBlock(user.id),
    getFactions(),
    getBusinesses(),
    takeoverNames(),
  ]);
  const wanted = wantsDossier(application);
  const complete = wanted && isStepComplete(application, "dossier");
  const editable = !!application && isEditable(application);

  const sections: TakeoverSection[] = [
    {
      id: "entreprise",
      label: "Entreprises",
      emblem: "coin",
      intro: "Reprendre une activité de la cité et la faire vivre : clientèle, employés, scènes. Tu peux aussi proposer une entreprise qui n'existe pas encore.",
      items: businesses.map(item => ({ id: item.id, name: item.name, meta: item.description, emblem: "coin", available: item.open })),
      empty: "Aucune entreprise n'est encore listée : tu peux proposer la tienne dans ton dossier.",
    },
    {
      id: "affinite",
      label: "Affinités",
      emblem: "laurel",
      intro: "Le lead d'une affinité guide ses membres, porte son histoire en jeu et la représente auprès de la cité.",
      items: affinities.map(item => ({ id: item.id, name: item.name, meta: `${item.god} · ${item.element}`, emblem: item.emblem, available: item.leadOpen })),
      empty: "Aucune affinité pour le moment.",
    },
    {
      id: "creature",
      label: "Créatures mystiques",
      emblem: "eye",
      intro: "Le lead d'une créature représente son peuple, encore solitaire et méfiant, auprès des habitants de Néa Hélikè.",
      items: creatures.map(item => ({ id: item.id, name: item.name, meta: item.originShort, emblem: item.emblem, available: item.leadOpen })),
      empty: "Aucune créature pour le moment.",
    },
  ];

  const cta = (() => {
    if (wanted && complete) return { text: <>Ton dossier porte sur : <strong>{dossierTargetLabel(application?.dossier, names)}</strong>.</>, href: editable ? stepHref("dossier") : null, label: "Modifier mon dossier" };
    if (wanted && editable)
      return {
        text: "Tu as demandé à déposer un dossier : il se remplit après le background, juste avant le récapitulatif.",
        href: canAccessStep(application, "dossier") ? stepHref("dossier") : "/portail/candidature",
        label: canAccessStep(application, "dossier") ? "Remplir mon dossier" : "Continuer ma candidature",
      };
    if (editable) return { text: "Pour déposer un dossier, coche la case « dossier de reprise » à l'étape HRP de ta candidature : une étape s'ajoutera.", href: stepHref("hrp"), label: "Aller à l'étape HRP" };
    if (application) return { text: "Ta candidature est déjà envoyée : le dossier de reprise se dépose avec la candidature.", href: null, label: "" };
    if (block) return { text: "Le dossier de reprise se dépose avec une candidature.", href: null, label: "" };
    return { text: "Le dossier se dépose avec ta candidature : coche la case « dossier de reprise » à l'étape HRP.", href: "/portail/candidature", label: "Commencer ma candidature" };
  })();

  return (
    <>
      <PortalHeader
        eyebrow="Dossier de reprise"
        title="Reprendre un rôle de la cité"
        actions={wanted && <Badge tone={complete ? "success" : "gold"} size="lg">{complete ? "Dossier complet" : "Dossier à compléter"}</Badge>}
      >
        Une entreprise, ou le lead d&apos;une affinité ou d&apos;une créature. Choisis une catégorie pour voir ce qui est encore disponible.
      </PortalHeader>
      <div className={styles.page}>
        <TakeoverExplorer sections={sections} />
        <Plaque rivets="none" className={styles.cta}>
          <p className={styles.ctaText}>{cta.text}</p>
          {cta.href && (
            <ButtonLink href={cta.href} size="lg">
              {cta.label}
            </ButtonLink>
          )}
        </Plaque>
        <Guide title="Ce que doit contenir un dossier" intro={DOSSIER_GUIDE.intro} items={DOSSIER_GUIDE.items} />
      </div>
    </>
  );
}
