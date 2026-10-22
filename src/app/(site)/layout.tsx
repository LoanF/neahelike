import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu" className="skip-link">Aller au contenu</a>
      <SiteHeader />
      <main id="contenu" tabIndex={-1}>{children}</main>
      <SiteFooter />
    </>
  );
}
