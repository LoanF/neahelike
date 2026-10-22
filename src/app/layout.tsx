import type { Metadata, Viewport } from "next";
import { Marcellus } from "next/font/google";
import "@/components/arc/foundation.css";
import "@/styles/tokens.css";
import "./globals.css";
import { SITE_URL } from "@/lib/site-url";

const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-marcellus",
  display: "swap",
});


// Le site reste invisible des moteurs de recherche tant que NEXT_PUBLIC_INDEXABLE n'est pas « true ».
const indexable = process.env.NEXT_PUBLIC_INDEXABLE === "true";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: indexable ? undefined : { index: false, follow: false },
  title: {
    default: "Néa Hélikè · Serveur RP FiveM whitelist",
    template: "%s · Néa Hélikè",
  },
  description: "La cité engloutie est sortie des eaux. Les dieux sont revenus avec elle. Serveur roleplay FiveM en whitelist dans l'univers de la mythologie grecque.",
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  // Sans titre ni description ici, chaque page garde les siens dans l'aperçu.
  openGraph: {
    siteName: "Néa Hélikè",
    locale: "fr_FR",
    type: "website",
  },
  // L'image d'aperçu vient de app/opengraph-image.tsx.
  twitter: { card: "summary_large_image" },
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
