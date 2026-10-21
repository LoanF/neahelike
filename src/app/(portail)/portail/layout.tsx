import { PortalShell } from "@/components/portal/shell";
import { requireUser } from "@/lib/session";

export default async function PortailShellLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <PortalShell user={user}>{children}</PortalShell>;
}
