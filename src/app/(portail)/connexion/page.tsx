import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/plaque";
import { AuthScreen } from "@/components/portal/auth-screen";
import { getCurrentUser, hasAcceptedCgu } from "@/lib/session";
import { loginWithDiscord } from "../actions";
import styles from "../portal.module.css";

export const metadata: Metadata = { title: "Connexion" };

const ERRORS: Record<string, string> = {
  AccessDenied: "Connexion refusée. Réessaie, ou contacte l'équipe sur Discord si le problème continue.",
  Configuration: "Le portail est mal configuré. Préviens l'équipe sur Discord.",
};

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.inGuild && hasAcceptedCgu(user) ? "/portail" : "/liaison");
  const { error } = await searchParams;

  return (
    <AuthScreen
      title="Le portail"
      quote="Les portes de la cité s'ouvrent à qui ose se présenter."
      art="gardien d'Hélikè devant les portes de bronze de la cité, torches, lumière chaude, style illustration peinte bronze et or"
    >
      <p className={styles.text}>
        Le portail whitelist passe par ton compte Discord. Tu y déposeras ta candidature et suivras chaque étape jusqu&apos;à ton entrée dans la cité.
      </p>
      {error && <p className={styles.error} role="alert">{ERRORS[error] ?? "La connexion a échoué. Réessaie dans un instant."}</p>}
      <form action={loginWithDiscord} className={styles.form}>
        <Button type="submit" size="lg" className={styles.submit}>Se connecter avec Discord</Button>
      </form>
      <div className={styles.back}>
        <Link href="/" className={styles.linkButton}>Retour au site</Link>
      </div>
    </AuthScreen>
  );
}
