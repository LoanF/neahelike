export const SITE = {
  name: "Néa Hélikè",
  tagline: "La cité renée des flots",
  discordUrl: "https://discord.gg/RScWE8buxP",
  /** Point d'entrée du portail whitelist (connexion Discord). */
  joinUrl: "/connexion",
};

export const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/lore", label: "Lore" },
  { href: "/reglement", label: "Règlement" },
  { href: "/faq", label: "FAQ" },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Le site",
    links: [
      { href: "/lore", label: "Lore" },
      { href: "/reglement", label: "Règlement" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Le portail",
    links: [
      { href: "/connexion", label: "Se connecter" },
      { href: "/portail/candidature", label: "Ma candidature" },
      { href: "/portail/dossier", label: "Dossier de reprise" },
    ],
  },
] as const;

export const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgu", label: "CGU" },
  { href: "/confidentialite", label: "Confidentialité" },
] as const;
