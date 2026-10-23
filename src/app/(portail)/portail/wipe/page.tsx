import { Check, CircleDashed, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, DotsRow, Plaque } from "@/components/plaque";
import { formatDate } from "@/components/portal/application-status";
import { PortalHeader } from "@/components/portal/shell";
import { getLatestApplication } from "@/lib/applications";
import { takeoverNames } from "@/lib/businesses";
import { RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";
import { canWipe, getLatestDecidedWipe, getOpenWipe, isWipeStepComplete } from "@/lib/wipes";
import styles from "../candidature/candidature.module.css";
import { cancelWipeAction, sendWipeAction, startWipeAction } from "./actions";
import wipe from "./wipe.module.css";

export const metadata: Metadata = { title: "Wipe de personnage" };

/** Erreurs par code (l'adresse ne transporte jamais de texte libre). */
const ERRORS: Record<string, string> = {
  limite: RATE_LIMIT_MESSAGE,
  demarrage: "Impossible de commencer ta demande : seul un joueur whitelist peut demander un wipe.",
  envoi: "Ta demande ne peut pas être envoyée : vérifie ton personnage et ton background, et que ton affinité ou ta créature accepte encore des membres.",
};

const STEP_LINKS = [
  { id: "rp", label: "Nouveau personnage", href: "/portail/wipe/rp" },
  { id: "background", label: "Son background", href: "/portail/wipe/background" },
] as const;

export default async function WipePage({ searchParams }: { searchParams: Promise<{ erreur?: string; envoyee?: string; annulee?: string }> }) {
  const { erreur, envoyee, annulee } = await searchParams;
  const user = await requireUser();
  const [latest, open, decided, names] = await Promise.all([getLatestApplication(user.id), getOpenWipe(user.id), getLatestDecidedWipe(user.id), takeoverNames()]);
  const error = erreur && Object.hasOwn(ERRORS, erreur) ? ERRORS[erreur] : null;
  const value = (values: Record<string, unknown> | null | undefined, key: string) => (typeof values?.[key] === "string" ? (values[key] as string) : "");

  return (
    <>
      <PortalHeader eyebrow="Wipe de personnage" title="Refaire mon personnage" actions={open && <Badge tone="gold" size="lg">{open.status === "envoyee" ? "Demande envoyée" : "Demande en cours"}</Badge>}>
        Un wipe remplace ton personnage par un nouveau : sa fiche et son background. Ta partie HRP ne change pas, et tu restes whitelist.
      </PortalHeader>
      <div className={styles.single}>
        {envoyee && <p className={styles.success} role="status">Ta demande est envoyée : un admin va la lire. Tu seras prévenu sur Discord et ici.</p>}
        {annulee && <p className={styles.success} role="status">Ta demande de wipe est annulée : ton personnage actuel reste.</p>}
        {error && <p className={styles.formError} role="alert">{error}</p>}

        <Plaque className={styles.panel}>
          <DotsRow className={styles.dots} />

          {!open && !canWipe(latest) && <p className={styles.intro}>Le wipe de personnage est réservé aux joueurs whitelist.</p>}

          {!open && canWipe(latest) && (
            <>
              {decided?.status === "refusee" && (
                <div className={wipe.result}>
                  <Badge tone="danger">Dernière demande refusée</Badge>
                  {decided.comment && <p className={wipe.quote}>« {decided.comment} »</p>}
                </div>
              )}
              {decided?.status === "acceptee" && (
                <div className={wipe.result}>
                  <Badge tone="success">Wipe accepté le {formatDate(decided.decidedAt ?? decided.createdAt)}</Badge>
                </div>
              )}
              <ol className={wipe.steps}>
                <li>Ouvre un ticket sur le Discord pour demander ton wipe.</li>
                <li>Si un admin l&apos;accepte sur le ticket, reviens ici et remplis ton nouveau personnage.</li>
                <li>Envoie ta demande : un admin la valide, et ton nouveau personnage remplace l&apos;ancien.</li>
              </ol>
              <form action={startWipeAction}>
                <Button type="submit" size="lg">Commencer ma demande de wipe</Button>
              </form>
            </>
          )}

          {open?.status === "ouverte" && (
            <>
              {open.invitedById && <p className={styles.intro}>Un admin t&apos;a invité à refaire ton personnage. Remplis les deux parties, puis envoie ta demande.</p>}
              <ul className={wipe.list}>
                {STEP_LINKS.map(step => {
                  const complete = isWipeStepComplete(open, step.id);
                  return (
                    <li key={step.id}>
                      <Link href={step.href} className={wipe.step}>
                        {complete ? <Check size={18} aria-hidden="true" /> : <CircleDashed size={18} aria-hidden="true" />}
                        <span>{step.label}</span>
                        <span className={wipe.stepState}>{complete ? "Rempli" : "À remplir"}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {STEP_LINKS.every(step => isWipeStepComplete(open, step.id)) && (
                <dl className={wipe.recap}>
                  <dt>Nouveau personnage</dt>
                  <dd>
                    {value(open.rp, "firstName")} {value(open.rp, "lastName")}, {value(open.rp, "age")} ans
                  </dd>
                  <dt>Affinité</dt>
                  <dd>{names[value(open.rp, "affinity")] ?? "Aucune"}</dd>
                  <dt>Créature</dt>
                  <dd>{names[value(open.rp, "creature")] ?? "Humain"}</dd>
                  <dt>Background</dt>
                  <dd>
                    <a href={value(open.background, "url")} target="_blank" rel="noreferrer" className={wipe.link}>
                      Ouvrir <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  </dd>
                </dl>
              )}
              <div className={wipe.actions}>
                <form action={cancelWipeAction}>
                  <Button type="submit" variant="ghost">Annuler ma demande</Button>
                </form>
                {STEP_LINKS.every(step => isWipeStepComplete(open, step.id)) ? (
                  <form action={sendWipeAction}>
                    <Button type="submit" size="lg">Envoyer ma demande de wipe</Button>
                  </form>
                ) : (
                  <Link href={STEP_LINKS.find(step => !isWipeStepComplete(open, step.id))!.href} className={wipe.continue}>
                    Continuer
                  </Link>
                )}
              </div>
            </>
          )}

          {open?.status === "envoyee" && (
            <>
              <p className={styles.intro}>Demande envoyée le {formatDate(open.submittedAt ?? open.createdAt)}. Un admin va la lire : en attendant, ton personnage actuel reste.</p>
              <form action={cancelWipeAction}>
                <Button type="submit" variant="ghost">Annuler ma demande</Button>
              </form>
            </>
          )}
        </Plaque>
      </div>
    </>
  );
}
