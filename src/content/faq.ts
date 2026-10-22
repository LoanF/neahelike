/*
 * FAQ du site. Modifiable uniquement ici, dans le code.
 */
export interface FaqGroup {
  title: string;
  items: { title: string; content: string }[];
}

export const FAQ: FaqGroup[] = [
  {
    title: "La whitelist",
    items: [
      {
        title: "Comment rejoindre le serveur ?",
        content: "Connecte ton compte Discord sur le portail, accepte les CGU, puis remplis ta candidature : infos hors-jeu, personnage, background. Si ton background est validé, un recruteur te reçoit sur Discord pour un court entretien vocal. Une fois le vocal réussi, tu es whitelist.",
      },
      {
        title: "Combien de temps prend une candidature ?",
        content: "Compte entre 48 et 72 heures pour la lecture de ta candidature. Tu reçois une notification sur le portail et un message privé Discord à chaque étape.",
      },
      {
        title: "Quel âge faut-il avoir ?",
        content: "18 ans minimum.",
      },
      {
        title: "Ma candidature a été refusée, que faire ?",
        content: "Le message de refus indique les critères qui n'allaient pas. Tu peux repasser une candidature au minimum 3 mois après le refus.",
      },
      {
        title: "Je n'ai pas fini ma candidature, je perds tout ?",
        content: "Non. Chaque étape est enregistrée au fur et à mesure : tu reprends exactement là où tu t'étais arrêté.",
      },
    ],
  },
  {
    title: "Ton personnage",
    items: [
      {
        title: "Puis-je jouer une affinité et une créature en même temps ?",
        content: "Oui. Tu peux choisir une affinité, une créature, les deux, ou aucune. Un Guerrier n'a aucun pouvoir divin.",
      },
      {
        title: "Pourquoi une créature est-elle marquée « Places closes » ?",
        content: "Les places des créatures et des affinités sont limitées pour garder l'équilibre de la cité. Quand elles sont closes, ce choix n'est plus disponible dans la candidature jusqu'à leur réouverture.",
      },
      {
        title: "Qu'est-ce qu'un dossier de reprise ?",
        content: "Un dossier pour reprendre une entreprise, ou prendre la tête d'une affinité ou d'une créature. Coche la case dans ta candidature : une étape « Dossier de reprise » s'ajoute à la fin.",
      },
      {
        title: "Quel format pour le background ?",
        content: "Un lien vers un document en lecture publique : Google Docs, Canva, Google Slides ou équivalent. Vérifie que le lien est bien accessible sans connexion.",
      },
    ],
  },
  {
    title: "Technique",
    items: [
      {
        title: "Ai-je besoin d'un micro ?",
        content: "Oui, un micro de qualité correcte est obligatoire, pour l'entretien vocal comme en jeu.",
      },
      {
        title: "Mes rôles Discord ne sont pas à jour sur le site.",
        content: "Le site relit tes rôles Discord régulièrement. Déconnecte-toi puis reconnecte-toi pour forcer la mise à jour. Si le problème persiste, ouvre un ticket sur le Discord.",
      },
    ],
  },
];
