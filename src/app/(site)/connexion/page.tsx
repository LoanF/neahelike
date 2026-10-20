import type { Metadata } from "next";
import { ButtonLink, DotsRow, Logo, Plaque, Spiral } from "@/components/plaque";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false },
};

// Provisoire : la connexion Discord (OAuth) et la page « Liaison réussie » arrivent en Phase 2.
export default function ConnexionPage() {
  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "64px 16px 0" }}>
      <Plaque unveil style={{ width: "100%", maxWidth: 440, padding: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
        <DotsRow style={{ alignSelf: "stretch", margin: "0 22px" }} />
        <Logo size={76} ring={3} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 26 }}>Le portail</h1>
          <Spiral />
        </div>
        <p style={{ color: "var(--nh-parchment-dim)" }}>
          Le portail whitelist ouvre très bientôt. Tu pourras y lier ton compte Discord et déposer ta candidature.
        </p>
        <ButtonLink href={SITE.discordUrl} size="md" style={{ width: "100%" }}>Rejoindre le Discord en attendant</ButtonLink>
        <ButtonLink href="/lore" variant="secondary" size="md" style={{ width: "100%" }}>Lire le lore</ButtonLink>
      </Plaque>
    </div>
  );
}
