/*
 * Textes de la candidature whitelist. Pour changer une consigne, modifier ce fichier.
 * La structure du formulaire (champs, étapes) vit dans lib/application.ts.
 */

/** Âge IRL minimum pour candidater : le serveur est réservé aux majeurs. */
export const MIN_AGE_IRL = 18;

/** Délai avant de pouvoir recandidater après un refus. */
export const REAPPLY_DELAY_MONTHS = 3;

export const CANDIDATURE_INTRO =
  "La candidature se remplit en plusieurs étapes. Chaque étape est enregistrée au fur et à mesure : tu peux t'arrêter et reprendre plus tard, rien ne sera perdu.";

/** Étapes du parcours complet, affichées sur le tableau de bord. */
export const JOURNEY = [
  { title: "Candidature écrite", text: "Infos HRP, personnage, background et, si tu veux, un dossier de reprise." },
  { title: "Lecture par l'équipe", text: "Un recruteur lit ta candidature. Il peut te demander de modifier une partie." },
  { title: "Entretien vocal", text: "Candidature validée : tu reçois le rôle « attente de wl » et passes un court entretien sur le Discord." },
  { title: "Whitelist", text: "Entretien réussi : tu reçois le rôle Magistrat et peux rejoindre la cité." },
] as const;

export const SHARED_LINK_HINT =
  "Partage ton document en lecture pour « toute personne disposant du lien ». Un lien privé ne peut pas être lu par l'équipe.";

export const LINK_HOSTS_HINT = "Google Docs, Google Slides, Canva, Notion, Google Drive (PDF)…";

export const BACKGROUND_GUIDE = {
  intro: "Le background raconte qui est ton personnage avant son arrivée à Néa Hélikè. Il n'y a pas de longueur imposée : la cohérence compte plus que le nombre de pages.",
  items: [
    "Son enfance, sa famille et le lieu d'où il vient.",
    "Les événements qui l'ont construit, et ce qui l'a mené à la cité.",
    "Son caractère : qualités, défauts, peurs, ce qui le fait avancer.",
    "Son lien avec son affinité ou sa nature de créature, si tu en as choisi une.",
    "Ce qu'il vient chercher à Néa Hélikè : ses objectifs.",
  ],
  warning: "Le personnage doit respecter le lore : pas de pouvoirs hors de son affinité, pas de lien de sang avec un dieu.",
} as const;

export const DOSSIER_KINDS = [
  { id: "entreprise", label: "Une entreprise", text: "Reprendre ou fonder une activité de la cité : forge, taverne, commerce…" },
  { id: "affinite", label: "Le lead d'une affinité", text: "Guider les membres d'une affinité et porter son histoire en jeu." },
  { id: "creature", label: "Le lead d'une créature", text: "Représenter un peuple de créatures mystiques auprès de la cité." },
] as const;

/** Entreprise qui n'est pas encore dans la liste : le joueur la nomme lui-même. */
export const NEW_BUSINESS = "nouvelle";

export const DOSSIER_GUIDE = {
  intro: "Le dossier de reprise montre à l'équipe ce que tu comptes faire du rôle que tu demandes. Il est lu en plus de ta candidature.",
  items: [
    "Ta motivation, et pourquoi ton personnage est le bon pour ce rôle.",
    "Tes projets concrets : animations, scènes, organisation.",
    "Comment tu comptes faire vivre le rôle pour les autres joueurs.",
    "Ta disponibilité : un lead doit être présent régulièrement.",
  ],
} as const;

export const CLOSED_LABEL = "Places closes pour le moment";
