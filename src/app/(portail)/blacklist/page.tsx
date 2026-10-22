import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/portal/auth-screen";
import { getBlacklistEntry } from "@/lib/blacklist";
import { getCurrentUser } from "@/lib/session";
import { logout } from "../actions";
import styles from "../portal.module.css";

export const metadata: Metadata = { title: "Accès refusé" };

/** Seule page accessible à un joueur blacklisté, quel que soit le lien qu'il ouvre dans le portail. */
export default async function BlacklistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const entry = await getBlacklistEntry(user.id);
  if (!entry) redirect("/portail");

  return (
    <AuthScreen
      title="Accès refusé"
      quote="Les portes de la cité se sont refermées."
      art="portes de bronze de Néa Hélikè closes sous un ciel d'orage, chaînes dorées, garde en armure de dos, lumière froide, style illustration peinte bronze et or"
    >
      <div className={styles.blacklist} role="alert">
        <strong>Tu es blacklist de Néa Hélikè.</strong>
        <span>Tu n&apos;as plus accès au portail ni au serveur Discord.</span>
        {entry.reason && (
          <span>
            Raison : <em>« {entry.reason} »</em>
          </span>
        )}
      </div>
      <form action={logout} className={styles.back}>
        <button type="submit" className={styles.linkButton}>Se déconnecter</button>
      </form>
    </AuthScreen>
  );
}
