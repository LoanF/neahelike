import { ButtonLink, Logo, Spiral } from "@/components/plaque";

// Accueil provisoire : la vraie page d'accueil arrive en Phase 1.
export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--nh-scene)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center" }}>
        <Logo size={104} ring={3} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h1 style={{ fontSize: "clamp(40px, 7vw, 80px)" }}>Néa Hélikè</h1>
          <Spiral />
        </div>
        <p style={{ fontSize: 19, color: "var(--nh-parchment-dim)" }}>La cité sort des eaux. Le site arrive bientôt.</p>
        <ButtonLink href="/kit" variant="secondary" size="lg">Voir les composants</ButtonLink>
      </div>
    </main>
  );
}
