import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/plaque";
import { AuthScreen } from "@/components/portal/auth-screen";
import { ProfileCard } from "@/components/portal/profile-card";
import { displayName } from "@/lib/discord-cdn";
import { requireUser } from "@/lib/session";
import { logout } from "../actions";
import styles from "../portal.module.css";

export const metadata: Metadata = { title: "Tableau de bord" };

// Provisoire : le tableau de bord complet (sidebar, candidature, dossiers) arrive en Phase 3.
export default async function PortailPage() {
  const user = await requireUser();

  return (
    <AuthScreen
      title="Bienvenue"
      quote="Le seuil est franchi. La cité t'observe."
      art="vue de Néa Hélikè depuis la colline du Colosse au coucher du soleil, style illustration peinte bronze et or"
    >
      <div className={styles.profile}>
        <ProfileCard user={user} />
      </div>
      <p className={styles.text}>
        Bienvenue, {displayName(user)}. Ton tableau de bord et ta candidature ouvrent très bientôt. En attendant, prends le temps de lire le lore et le règlement.
      </p>
      <div className={styles.actions}>
        <ButtonLink href="/lore" size="lg">Lire le lore</ButtonLink>
        <ButtonLink href="/reglement" variant="secondary" size="lg">Lire le règlement</ButtonLink>
      </div>
      <form action={logout} className={styles.back}>
        <Button type="submit" variant="ghost" size="sm">Se déconnecter</Button>
      </form>
    </AuthScreen>
  );
}
