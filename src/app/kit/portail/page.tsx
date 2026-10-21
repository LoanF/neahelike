import { notFound } from "next/navigation";
import { AuthScreen } from "@/components/portal/auth-screen";
import { ProfileCard } from "@/components/portal/profile-card";
import { LiaisonForm } from "../../(portail)/liaison/liaison-form";
import styles from "../../(portail)/portal.module.css";

// Aperçu de la page de liaison avec un profil fictif, pour travailler l'interface sans compte Discord.
export default function KitPortailPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <AuthScreen
      title="Liaison réussie"
      quote="Donne ton nom aux gardiens du seuil. La cité fera le reste."
      art="prêtresse d'Hélikè en pied devant le sanctuaire de Poséidon, torche à la main"
    >
      <div className={styles.profile}>
        <ProfileCard user={{ id: "284019375610482688", username: "thalia.wav", globalName: "Thalia", avatar: null, banner: null, rank: "joueur" }} />
      </div>
      <p className={styles.text}>
        Ton compte Discord est lié au portail. Accepte les CGU pour accéder à ta candidature. Tu te connecteras toujours via Discord.
      </p>
      <LiaisonForm />
    </AuthScreen>
  );
}
