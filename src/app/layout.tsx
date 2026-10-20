import type { Metadata, Viewport } from "next";
import { Marcellus } from "next/font/google";
import "@/components/arc/foundation.css";
import "@/styles/tokens.css";
import "./globals.css";

const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-marcellus",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

// Le site reste invisible des moteurs de recherche tant que NEXT_PUBLIC_INDEXABLE n'est pas « true ».
const indexable = process.env.NEXT_PUBLIC_INDEXABLE === "true";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  robots: indexable ? undefined : { index: false, follow: false },
  title: {
    default: "Néa Hélikè · Serveur RP FiveM whitelist",
    template: "%s · Néa Hélikè",
  },
  description: "La cité engloutie est sortie des eaux. Les dieux sont revenus avec elle. Serveur roleplay FiveM en whitelist dans l'univers de la mythologie grecque.",
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  openGraph: {
    title: "Néa Hélikè",
    description: "Serveur roleplay FiveM en whitelist, dans l'univers de la mythologie grecque.",
    images: ["/images/logo.png"],
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0907",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-theme="dark" className={marcellus.variable}>
      <body>{children}</body>
    </html>
  );
}
