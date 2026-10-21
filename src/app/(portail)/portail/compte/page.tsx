import type { Metadata } from "next";
import Link from "next/link";
import { Button, DotsRow, Plaque } from "@/components/plaque";
import { formatDate } from "@/components/portal/application-status";
import { ProfileCard } from "@/components/portal/profile-card";
import { PortalHeader } from "@/components/portal/shell";
import { requireUser } from "@/lib/session";
import { logout } from "../../actions";
import styles from "./compte.module.css";

export const metadata: Metadata = { title: "Mon compte" };

export default async function ComptePage() {
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
      </div>
    </>
  );
}
