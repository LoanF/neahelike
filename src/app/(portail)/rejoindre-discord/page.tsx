import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, ButtonLink } from "@/components/plaque";
import { AuthScreen } from "@/components/portal/auth-screen";
import { ProfileCard } from "@/components/portal/profile-card";
import { SITE } from "@/content/site";
import { getBlacklistEntry } from "@/lib/blacklist";
import { RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { logout, recheckGuild } from "../actions";
import styles from "../portal.module.css";

export const metadata: Metadata = { title: "Rejoins le Discord" };

export default async function RejoindreDiscordPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (await getBlacklistEntry(user.id)) redirect("/blacklist");
  if (user.inGuild) redirect("/liaison");
  const { erreur } = await searchParams;

  return (
    <AuthScreen
      title="Un dernier pas"
      quote="Nul ne franchit le seuil sans s'être présenté à l'Agora."
      art="l'Agora de Néa Hélikè à l'aube, foule de citoyens, colonnes, lumière dorée, style illustration peinte bronze et or"
    >
      <div className={styles.profile}>
        <ProfileCard user={user} />
      </div>
      <p className={styles.text}>
        Ton compte n&apos;est pas encore sur le serveur Discord de Néa Hélikè. Rejoins-le : c&apos;est là que se passent les annonces, le recrutement et ton entretien vocal.
      </p>
      {erreur === "limite" && <p className={styles.error} role="alert">{RATE_LIMIT_MESSAGE}</p>}
      {erreur === "absent" && (
        <p className={styles.error} role="alert">On ne te trouve toujours pas sur le serveur. Vérifie que tu as bien accepté l&apos;invitation, puis réessaie.</p>
      )}
      <div className={styles.actions}>
        <ButtonLink href={SITE.discordUrl} target="_blank" rel="noreferrer" size="lg">Rejoindre le Discord</ButtonLink>
        <form action={recheckGuild}>
          <Button type="submit" variant="secondary" size="lg" style={{ width: "100%" }}>J&apos;ai rejoint le serveur</Button>
        </form>
      </div>
      <form action={logout} className={styles.back}>
        <button type="submit" className={styles.linkButton}>Se déconnecter</button>
      </form>
    </AuthScreen>
  );
}
