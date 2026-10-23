import type { Metadata } from "next";
import { Badge, ButtonLink, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { DOSSIER_GUIDE } from "@/content/candidature";
import { canAccessStep, dossierTargetLabel, isStepComplete, stepHref, wantsDossier } from "@/lib/application";
import { getLatestApplication, getOpenApplication, getStartBlock, isEditable } from "@/lib/applications";
import { getBusinesses, takeoverNames } from "@/lib/businesses";
import { getFactions } from "@/lib/factions";
import { requireUser } from "@/lib/session";
import { canFileStandalone, getOpenDossier, listDossiers } from "@/lib/takeovers";
import { Guide } from "../candidature/[etape]/guide";
import styles from "./dossier.module.css";
import type { TakeoverSection } from "./takeover-explorer";
import { TakeoverExplorer } from "./takeover-explorer";

export const metadata: Metadata = { title: "Dossier de reprise" };

export default async function DossierPage({ searchParams }: { searchParams: Promise<{ envoye?: string }> }) {
  const { envoye } = await searchParams;
  const user = await requireUser();
  // Chaque table n'est lue qu'une fois par requête (cache) : les noms des archivées viennent de la même lecture.
  const [application, latest, standalone, dossiers, { affinities, creatures }, businesses, names] = await Promise.all([
    getOpenApplication(user.id),
    getLatestApplication(user.id),
    getOpenDossier(user.id),
    listDossiers(user.id),
    getFactions(),
    getBusinesses(),
    takeoverNames(),
  ]);
  // Dernière décision de l'équipe, tant qu'aucun nouveau dossier n'est en cours.
  const decided = dossiers[0]?.status === "accepte" || dossiers[0]?.status === "refuse" ? dossiers[0] : null;
  const block = application ? null : await getStartBlock(user.id);
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
    // Candidature partie sans dossier (ou joueur whitelist) : le dossier se dépose à part, relu par l'équipe.
    if (canFileStandalone(latest)) {
      if (standalone?.status === "envoye")
        return { text: <>Ton dossier de reprise (<strong>{dossierTargetLabel(standalone.content, names) ?? "reprise"}</strong>) est envoyé : l&apos;équipe va le lire et te répondra.</>, href: null, label: "" };
      if (standalone) return { text: "Tu as commencé un dossier de reprise : termine-le et envoie-le à l'équipe.", href: "/portail/dossier/deposer", label: "Reprendre mon dossier" };
      return { text: "Ta candidature est partie sans dossier : tu peux en déposer un à part. L'équipe le lira et te répondra.", href: "/portail/dossier/deposer", label: "Déposer un dossier de reprise" };
    }
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
        {envoye && (
          <p className={styles.notice} role="status">
            Dossier envoyé : l&apos;équipe va le lire. Tu seras prévenu sur Discord et ici.
          </p>
        )}
        {decided && (
          <Plaque rivets="none" className={styles.decision}>
            <Badge tone={decided.status === "accepte" ? "success" : "danger"}>{decided.status === "accepte" ? "Dossier accepté" : "Dossier refusé"}</Badge>
            <p className={styles.ctaText}>{dossierTargetLabel(decided.content, names)}</p>
            {decided.comment && <p className={styles.quote}>« {decided.comment} »</p>}
          </Plaque>
        )}
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
