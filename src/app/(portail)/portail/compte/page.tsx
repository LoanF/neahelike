import type { Metadata } from "next";
import Link from "next/link";
import { Button, DotsRow, Plaque } from "@/components/plaque";
import { formatDate } from "@/components/portal/application-status";
import { ProfileCard } from "@/components/portal/profile-card";
import { PortalHeader } from "@/components/portal/shell";
import { requireUser } from "@/lib/session";
import { logout } from "../../actions";
import styles from "./compte.module.css";
import { DeleteForm } from "./delete-form";

export const metadata: Metadata = { title: "Mon compte" };

export default async function ComptePage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const user = await requireUser();

  return (
    <>
      <PortalHeader eyebrow="Mon compte" title="Ton compte">
        Ton compte est lié à Discord : ton pseudo et ton avatar se mettent à jour à chaque connexion.
      </PortalHeader>
      <div className={styles.page}>
        <Plaque unveil className={styles.panel}>
          <DotsRow className={styles.dots} />
          <ProfileCard user={user} />
          <dl className={styles.facts}>
            <div>
              <dt>Compte créé le</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt>CGU acceptées le</dt>
              <dd>{user.cguAcceptedAt ? formatDate(user.cguAcceptedAt) : "—"}</dd>
            </div>
          </dl>
          <p className={styles.text}>
            Le portail conserve ton profil Discord, ta candidature et l&apos;historique de son traitement. Le détail est dans la{" "}
            <Link href="/confidentialite" target="_blank">politique de confidentialité</Link>.
          </p>
          <form action={logout}>
            <Button type="submit" variant="secondary">Se déconnecter</Button>
          </form>
        </Plaque>

        <Plaque className={`${styles.panel} ${styles.danger}`} rivets="none">
          <h2 className={styles.title}>Supprimer mon compte</h2>
          <p className={styles.text}>
            Ta candidature, ton dossier de reprise et tes notifications sont effacés. L&apos;équipe garde seulement la trace anonyme de ses propres actions.
            Si tu passais ton entretien, le rôle « attente de wl » t&apos;est retiré. Tu pourras recréer un compte à tout moment en te reconnectant avec Discord.
          </p>
          {erreur === "confirmation" && (
            <p className={styles.error} role="alert">
              Coche la case et recopie SUPPRIMER pour confirmer.
            </p>
          )}
          <DeleteForm />
        </Plaque>
      </div>
    </>
  );
}
