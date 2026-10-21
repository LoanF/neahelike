/*
 * Pages légales. ⚠ Textes provisoires : à faire relire et compléter par l'équipe
 * (responsable de publication, hébergeur, contact) avant la mise en ligne.
 */
export interface LegalDoc {
  title: string;
  lead: string;
  updatedAt: string;
  /** Plusieurs révisions le même jour : à incrémenter pour que la nouvelle version soit acceptée de nouveau. */
  revision?: number;
  sections: { title: string; text: string }[];
}

export const LEGAL: Record<"cgu" | "confidentialite" | "mentions-legales", LegalDoc> = {
  cgu: {
    title: "Conditions générales d'utilisation",
    lead: "Les règles d'utilisation du site et du portail whitelist de Néa Hélikè.",
    updatedAt: "2026-10-21",
    revision: 2,
    sections: [
      { title: "Objet", text: "Le site présente le serveur roleplay FiveM Néa Hélikè et permet de déposer une candidature à la whitelist. Il s'agit d'un projet communautaire, gratuit, sans lien avec Rockstar Games ni Take-Two Interactive." },
      { title: "Accès au portail", text: "Le portail est accessible via un compte Discord. En liant ton compte, tu autorises le site à lire ton identifiant, ton pseudo, ton avatar et tes rôles sur le serveur Discord de Néa Hélikè. Il faut avoir au moins 18 ans." },
      { title: "Candidature", text: "Tu t'engages à fournir des informations exactes. Les liens que tu partages (background, dossier) doivent être accessibles en lecture et ne contenir aucun contenu illégal, haineux ou à caractère sexuel." },
      { title: "Décisions de l'équipe", text: "L'équipe de recrutement est libre d'accepter, de refuser ou de demander la modification d'une candidature. Après un refus, une nouvelle candidature est possible au minimum 3 mois plus tard." },
      { title: "Messages Discord", text: "Le bot du serveur peut t'envoyer des messages privés pour t'informer de l'avancement de ta candidature et t'attribuer des rôles sur le Discord." },
      {
        title: "Suppression du compte",
        text: "Pour supprimer ton compte, ouvre un ticket sur le serveur Discord et adresse ta demande à un administrateur. Elle est traitée dans un délai d'un mois au plus. Sans réponse au bout de deux semaines, envoie un message privé sur Discord au propriétaire du serveur, demonou. La suppression efface ton compte, ta candidature, ton dossier de reprise et tes notifications ; l'historique des actions de l'équipe est anonymisé. Elle retire aussi ta whitelist sur le Discord : tu retrouves le rôle de base, et il faudra déposer une nouvelle candidature pour rejoindre la cité. Si ta candidature a été refusée il y a moins de 3 mois, ton identifiant Discord et la date de fin du délai sont conservés jusqu'à cette date, pour faire respecter le délai avant une nouvelle candidature.",
      },
      { title: "Sanctions", text: "Un usage abusif du portail (spam, usurpation, contenu interdit) peut entraîner la suppression du compte et le refus définitif de la whitelist." },
    ],
  },
  confidentialite: {
    title: "Confidentialité",
    lead: "Quelles données le site conserve, pourquoi, et comment les supprimer.",
    updatedAt: "2026-10-21",
    sections: [
      { title: "Données collectées", text: "Depuis Discord : identifiant, pseudo, nom affiché, avatar, bannière et rôles sur le serveur. Depuis ta candidature : âge IRL, heures de RP, expériences, informations de ton personnage et liens vers tes documents. Pendant son traitement : les décisions de l'équipe et ses notes internes, que tu ne vois pas." },
      { title: "Utilisation", text: "Ces données servent uniquement à traiter ta candidature, à gérer ton accès au serveur et à t'envoyer des notifications. Elles ne sont ni vendues ni partagées en dehors de l'équipe du serveur." },
      {
        title: "Conservation",
        text: "Les données sont conservées tant que ton compte existe. La suppression du compte efface ta candidature et tes informations personnelles. Seule exception : après un refus de moins de 3 mois, ton identifiant Discord et la date de fin du délai sont gardés jusqu'à cette date, pour faire respecter le délai avant une nouvelle candidature, puis effacés automatiquement.",
      },
      {
        title: "Tes droits",
        text: "Tu peux demander l'accès, la rectification ou la suppression de tes données à tout moment, par ticket sur le serveur Discord auprès d'un administrateur. La demande est traitée dans un délai d'un mois au plus. Sans réponse au bout de deux semaines, envoie un message privé sur Discord au propriétaire du serveur, demonou.",
      },
      { title: "Cookies", text: "Le site utilise uniquement un cookie de session, nécessaire à la connexion. Aucun cookie publicitaire ni de mesure d'audience tiers." },
    ],
  },
  "mentions-legales": {
    title: "Mentions légales",
    lead: "Informations sur l'éditeur et l'hébergeur du site.",
    updatedAt: "2026-10-20",
    sections: [
      { title: "Éditeur", text: "Néa Hélikè, projet communautaire non commercial. Contact : par ticket sur le serveur Discord." },
      { title: "Hébergement", text: "À compléter avant la mise en ligne (hébergeur, adresse)." },
      { title: "Propriété", text: "GTA V et FiveM sont des marques de leurs propriétaires respectifs. Néa Hélikè n'est affilié ni à Rockstar Games, ni à Take-Two Interactive, ni à Cfx.re. Les textes et visuels du site appartiennent à l'équipe de Néa Hélikè." },
    ],
  },
};

/** Version des CGU acceptée par les joueurs : changer la date oblige à les accepter de nouveau. */
export const CGU_VERSION = LEGAL.cgu.revision ? `${LEGAL.cgu.updatedAt}.${LEGAL.cgu.revision}` : LEGAL.cgu.updatedAt;
