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
  validee: (session: string): NotificationText => ({
    type: "candidature.validee",
    title: "Candidature validée",
    body: `Prochaine session de whitelist : ${session}. Tu as reçu le rôle « attente de wl » : rejoins un salon d'attente vocal sur le Discord à ce moment-là pour passer ton entretien.`,
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
    body: "Ton entretien est validé : tu es whitelist. La cité t'attend.",
    href: "/portail",
  }),
  whitelistRetiree: (reason: string | null): NotificationText => ({
    type: "whitelist.retiree",
    title: "Whitelist retirée",
    body: `L'équipe t'a retiré ta whitelist${reason ? ` : « ${reason} »` : ""}. Tu peux déposer une nouvelle candidature dès maintenant.`,
    href: "/portail",
  }),
  delaiLeve: (): NotificationText => ({
    type: "candidature.delai_leve",
    title: "Délai levé",
    body: "L'équipe a levé le délai de 3 mois : tu peux déposer une nouvelle candidature dès maintenant.",
    href: "/portail/candidature",
  }),
  rouverte: (): NotificationText => ({
    type: "candidature.rouverte",
    title: "Candidature rouverte",
    body: "L'équipe a annulé le refus : ta candidature est de nouveau en cours de lecture.",
    href: "/portail",
  }),
  dossierAccepte: (target: string): NotificationText => ({
    type: "dossier.accepte",
    title: "Dossier de reprise accepté",
    body: `L'équipe a accepté ton dossier de reprise (${target}).`,
    href: "/portail/dossier",
  }),
  dossierRefuse: (target: string): NotificationText => ({
    type: "dossier.refuse",
    title: "Dossier de reprise refusé",
    body: `L'équipe a refusé ton dossier de reprise (${target}). Le message de l'équipe est sur la page Dossier de reprise.`,
    href: "/portail/dossier",
  }),
  wipeInvitation: (): NotificationText => ({
    type: "wipe.invitation",
    title: "Wipe de personnage",
    body: "Un admin t'invite à refaire ton personnage : remplis le nouveau (personnage et background), puis envoie ta demande.",
    href: "/portail/wipe",
  }),
  wipeAcceptee: (): NotificationText => ({
    type: "wipe.acceptee",
    title: "Wipe accepté",
    body: "Ton nouveau personnage remplace l'ancien. Bon jeu à Néa Hélikè.",
    href: "/portail/wipe",
  }),
  wipeRefusee: (): NotificationText => ({
    type: "wipe.refusee",
    title: "Wipe refusé",
    body: "Un admin a refusé ta demande de wipe : ton personnage actuel reste. Le message de l'équipe est sur la page Wipe.",
    href: "/portail/wipe",
  }),
  supprimee: (): NotificationText => ({
    type: "candidature.supprimee",
    title: "Candidature effacée",
    body: "L'équipe a effacé ta candidature. Tu peux en commencer une nouvelle dès maintenant.",
    href: "/portail/candidature",
  }),
};
