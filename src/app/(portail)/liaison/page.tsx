import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/portal/auth-screen";
import { ProfileCard } from "@/components/portal/profile-card";
import { hasAcceptedCgu, requireUser } from "@/lib/session";
import { logout } from "../actions";
import styles from "../portal.module.css";
import { LiaisonForm } from "./liaison-form";

export const metadata: Metadata = { title: "Liaison réussie" };

export default async function LiaisonPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const user = await requireUser({ cgu: false });
  if (hasAcceptedCgu(user)) redirect("/portail");
  const { erreur } = await searchParams;
  const renewal = !!user.cguAcceptedAt;

  return (
    <AuthScreen
      title="Liaison réussie"
      quote="Donne ton nom aux gardiens du seuil. La cité fera le reste."
      art="prêtresse d'Hélikè en pied devant le sanctuaire de Poséidon, torche à la main, lumière chaude de côté, liseré froid, style illustration peinte bronze et or"
    >
      <div className={styles.profile}>
        <ProfileCard user={user} />
      </div>
      <p className={styles.text}>
        {renewal
          ? "Les conditions générales d'utilisation ont changé. Accepte la nouvelle version pour retrouver ton portail."
          : "Ton compte Discord est lié au portail. Accepte les CGU pour accéder à ta candidature. Tu te connecteras toujours via Discord."}
      </p>
      {erreur === "cgu" && <p className={styles.error} role="alert">Coche la case pour accepter les CGU.</p>}
      <LiaisonForm />
      <form action={logout} className={styles.back}>
        <button type="submit" className={styles.linkButton}>Retour à la connexion</button>
      </form>
    </AuthScreen>
  );
}
