import { ButtonLink, DotsRow, Logo, Plaque } from "@/components/plaque";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16, background: "var(--nh-scene)" }}>
      <Plaque unveil style={{ width: "100%", maxWidth: 460, padding: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
        <DotsRow style={{ alignSelf: "stretch", margin: "0 22px" }} />
        <Logo size={76} ring={3} />
        <h1 style={{ fontSize: 26 }}>Perdue dans les abysses</h1>
        <p style={{ color: "var(--nh-parchment-dim)" }}>Cette page a sombré avec l&apos;ancienne Hélikè. Les flots ne l&apos;ont pas rendue.</p>
        <ButtonLink href="/" size="md" style={{ width: "100%" }}>Revenir à la cité</ButtonLink>
      </Plaque>
    </main>
  );
}
