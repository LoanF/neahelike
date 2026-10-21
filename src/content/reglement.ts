/*
 * Règlement du serveur. Modifiable uniquement ici, dans le code.
 * ⚠ Version provisoire : à remplacer par le règlement officiel de l'équipe.
 */
export const RULES_UPDATED_AT = "2026-10-20";
export const RULES_DRAFT = true;

export interface RuleArticle {
  title: string;
  text: string;
}

export interface RuleChapter {
  id: string;
  title: string;
  intro?: string;
  articles: RuleArticle[];
}

export const RULES: RuleChapter[] = [
  {
    id: "general",
    title: "Général",
    intro: "En rejoignant Néa Hélikè, tu acceptes ce règlement dans son intégralité. L'ignorer n'est pas une excuse.",
    articles: [
      { title: "Âge minimum", text: "Le serveur est accessible à partir de 18 ans. Un mensonge sur l'âge entraîne le retrait de la whitelist." },
      { title: "Respect", text: "Le respect entre joueurs et envers l'équipe est obligatoire, en jeu comme sur le Discord. Aucune forme de harcèlement, de discrimination ou d'insulte HRP n'est tolérée." },
      { title: "Matériel", text: "Un micro de qualité correcte est obligatoire. Le chat écrit ne remplace pas la voix en jeu." },
      { title: "Décisions de l'équipe", text: "Les décisions du staff s'appliquent immédiatement. Une contestation se fait calmement, par ticket sur le Discord, jamais en jeu." },
    ],
  },
  {
    id: "hrp",
    title: "Hors roleplay",
    articles: [
      { title: "Discussions HRP", text: "Le HRP en jeu est interdit, sauf en cas de problème technique. Utilise alors un langage discret et reviens au RP au plus vite." },
      { title: "Métagaming", text: "Utiliser en jeu une information obtenue hors du jeu (stream, Discord, appel) est interdit." },
      { title: "Bugs et exploits", text: "Tout bug doit être signalé à l'équipe. En profiter volontairement est sanctionné." },
    ],
  },
  {
    id: "roleplay",
    title: "Roleplay",
    intro: "Néa Hélikè se joue en 360 av. J.-C. Ton personnage vit dans une cité grecque antique, avec ses dieux, ses lois et ses peurs.",
    articles: [
      { title: "Cohérence d'époque", text: "Vocabulaire, objets et comportements doivent rester cohérents avec l'Antiquité grecque. Pas de références modernes en RP." },
      { title: "Valeur de la vie", text: "Ton personnage tient à sa vie. Face à une menace sérieuse, il réagit en conséquence : il ne prend pas de risques absurdes." },
      { title: "Powergaming", text: "Imposer une action à un autre joueur sans lui laisser de réponse, ou réaliser une action impossible, est interdit." },
      { title: "Respect des dieux", text: "Les dieux existent et la cité les craint. Les offenser a des conséquences RP, que l'équipe peut mettre en scène." },
    ],
  },
  {
    id: "pouvoirs",
    title: "Affinités et créatures",
    articles: [
      { title: "Usage des pouvoirs", text: "Les pouvoirs des affinités se jouent avec mesure. Ils servent l'histoire, pas la victoire à tout prix." },
      { title: "Créatures mystiques", text: "Une créature doit jouer ses faiblesses autant que ses capacités. Une créature qui ignore ses faiblesses peut perdre son statut." },
      { title: "Une seule affinité", text: "Un personnage ne peut appartenir qu'à une seule affinité à la fois, après acceptation par son prêtre." },
    ],
  },
  {
    id: "sanctions",
    title: "Sanctions",
    articles: [
      { title: "Échelle", text: "Selon la gravité : avertissement, exclusion temporaire, retrait de la whitelist, bannissement définitif." },
      { title: "Récidive", text: "La récidive aggrave systématiquement la sanction." },
    ],
  },
];
