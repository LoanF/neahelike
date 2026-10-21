import { PortalShell } from "@/components/portal/shell";
import { requireUser } from "@/lib/session";

/** Espace équipe : recruteurs et staff uniquement (rang relu depuis Discord). */
export default async function EquipeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser({ rank: "recruteur" });
  return <PortalShell user={user}>{children}</PortalShell>;
}
