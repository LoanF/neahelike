import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { getLatestApplication } from "@/lib/applications";
import { requireUser } from "@/lib/session";
import { canFileStandalone, getOpenDossier } from "@/lib/takeovers";
import { formChoices } from "../../candidature/[etape]/choices";
import { DossierForm } from "../../candidature/[etape]/dossier-form";
import styles from "../dossier.module.css";

export const metadata: Metadata = { title: "Déposer un dossier de reprise" };

/** Dossier de reprise déposé à part, après une candidature envoyée sans dossier. */
export default async function DeposerDossierPage() {
  const user = await requireUser();
  const [latest, open, { leads }] = await Promise.all([getLatestApplication(user.id), getOpenDossier(user.id), formChoices()]);
  if (!canFileStandalone(latest) || open?.status === "envoye") redirect("/portail/dossier");

  return (
    <>
      <PortalHeader eyebrow="Dossier de reprise" title="Déposer un dossier">
        Ton dossier est enregistré au fur et à mesure. Une fois envoyé, l&apos;équipe le lit et l&apos;accepte ou le refuse : tu es prévenu sur Discord et ici.
      </PortalHeader>
      <div className={styles.page}>
        <Plaque unveil className={styles.formPanel}>
          <DotsRow />
          <DossierForm initial={open?.content ?? {}} leads={leads} backHref="/portail/dossier" channel="dossier" submitLabel="Envoyer le dossier" />
        </Plaque>
      </div>
    </>
  );
}
