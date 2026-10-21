/*
 * Notifications de la cloche du portail, envoyées au joueur à chaque décision de l'équipe.
 * Elles doublent les messages privés Discord : un joueur aux MP fermés est quand même prévenu.
 */

export interface NotificationText {
  type: string;
  title: string;
  body: string;
  href: string;
}

export const NOTIFICATIONS = {
  validee: (): NotificationText => ({
    type: "candidature.validee",
    title: "Candidature validée",
    body: "Tu as reçu le rôle « attente de wl » : rejoins un salon d'attente vocal sur le Discord pour passer ton entretien.",
    href: "/portail",
  }),
  modification: (steps: string[]): NotificationText => ({
    type: "candidature.modification",
    title: "Modification demandée",
    body: `L'équipe te demande de reprendre : ${steps.join(", ")}.`,
    href: "/portail/candidature",
  }),
  refusee: (until: string): NotificationText => ({
    type: "candidature.refusee",
    title: "Candidature refusée",
    body: `Tu pourras en déposer une nouvelle à partir du ${until}. Les raisons sont sur ton tableau de bord.`,
    href: "/portail",
  }),
  whitelistee: (): NotificationText => ({
    type: "entretien.valide",
    title: "Bienvenue à Néa Hélikè",
    body: "Ton entretien est validé : tu es whitelisté. La cité t'attend.",
    href: "/portail",
  }),
  supprimee: (): NotificationText => ({
    type: "candidature.supprimee",
    title: "Candidature effacée",
    body: "L'équipe a effacé ta candidature. Tu peux en commencer une nouvelle dès maintenant.",
    href: "/portail/candidature",
  }),
};
