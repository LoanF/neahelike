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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
