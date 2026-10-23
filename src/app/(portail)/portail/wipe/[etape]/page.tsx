import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { requireUser } from "@/lib/session";
import { getOpenWipe, isWipeStep, isWipeStepComplete } from "@/lib/wipes";
import { BackgroundForm } from "../../candidature/[etape]/background-form";
import { formChoices } from "../../candidature/[etape]/choices";
import { RpForm } from "../../candidature/[etape]/rp-form";
import styles from "../../candidature/candidature.module.css";

export const metadata: Metadata = { title: "Wipe de personnage" };

/** Nouveau personnage du wipe : mêmes formulaires que la candidature, sans la partie HRP. */
export default async function WipeStepPage({ params }: { params: Promise<{ etape: string }> }) {
  const { etape } = await params;
  if (!isWipeStep(etape)) notFound();
  const user = await requireUser();
  const wipe = await getOpenWipe(user.id);
  if (wipe?.status !== "ouverte") redirect("/portail/wipe");
  if (etape === "background" && !isWipeStepComplete(wipe, "rp")) redirect("/portail/wipe/rp");
  const { affinities, creatures } = await formChoices();

  return (
    <>
      <PortalHeader eyebrow={`Wipe de personnage · étape ${etape === "rp" ? 1 : 2} sur 2`} title={etape === "rp" ? "Ton nouveau personnage" : "Son histoire"} />
      <div className={styles.single}>
        <Plaque unveil className={styles.panel}>
          <DotsRow className={styles.dots} />
          {etape === "rp" ? (
            <RpForm initial={wipe.rp ?? {}} affinities={affinities} creatures={creatures} backHref="/portail/wipe" channel="wipe" />
          ) : (
            <BackgroundForm initial={wipe.background ?? {}} backHref="/portail/wipe/rp" channel="wipe" />
          )}
        </Plaque>
      </div>
    </>
  );
}
