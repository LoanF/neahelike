/*
 * Textes de l'espace équipe : messages privés envoyés par le bot.
 * Les critères de refus se gèrent depuis l'administration (table refusal_criteria).
 */

/** Couleur des embeds Discord (or du site). */
const EMBED_COLOR = 0xd1a64a;
const EMBED_DANGER = 0xc4583a;
const EMBED_SUCCESS = 0x8fae5a;

type Embed = { title: string; description: string; color: number; fields?: { name: string; value: string }[]; footer?: { text: string } };

const footer = { text: "Néa Hélikè · Portail whitelist" };

export const DIRECT_MESSAGES = {
  validee: (session: string): Embed => ({
    title: "Candidature validée",
    description:
      "Ta candidature écrite à Néa Hélikè est validée.\n\nTu as reçu le rôle **attente de wl** : rejoins un salon d'attente vocal sur le Discord pendant la prochaine session de whitelist pour passer ton entretien.",
    color: EMBED_COLOR,
    fields: [{ name: "Prochaine session de whitelist", value: session.charAt(0).toUpperCase() + session.slice(1) + " (heure de Paris)" }],
    footer,
  }),
  modification: ({ steps, comment, url }: { steps: string[]; comment: string; url: string }): Embed => ({
    title: "Modification demandée",
    description: `L'équipe te demande de modifier ta candidature avant de la relire.\n\nRends-toi sur le portail : ${url}`,
    color: EMBED_COLOR,
    fields: [
      { name: "Parties à reprendre", value: steps.join(", ") },
      ...(comment ? [{ name: "Message de l'équipe", value: comment.slice(0, 1000) }] : []),
    ],
    footer,
  }),
  refusee: ({ criteria, comment, until }: { criteria: string[]; comment: string; until: string }): Embed => ({
    title: "Candidature refusée",
    description: `Ta candidature à Néa Hélikè a été refusée. Tu pourras en déposer une nouvelle à partir du **${until}**, soit 3 mois minimum.`,
    color: EMBED_DANGER,
    fields: [
      ...(criteria.length > 0 ? [{ name: "Critères", value: criteria.map(item => `• ${item}`).join("\n") }] : []),
      ...(comment ? [{ name: "Message de l'équipe", value: comment.slice(0, 1000) }] : []),
    ],
    footer,
  }),
  compteSupprime: ({ url }: { url: string }): Embed => ({
    title: "Compte du portail supprimé",
    description: `Ton compte sur le portail de Néa Hélikè a été supprimé, comme tu l'as demandé. Ta whitelist est retirée : tu retrouves le rôle **Novice**.\n\nPour rejoindre à nouveau la cité, reconnecte-toi au portail et dépose une nouvelle candidature : ${url}`,
    color: EMBED_COLOR,
    footer,
  }),
  whitelistRetiree: ({ reason, url }: { reason: string | null; url: string }): Embed => ({
    title: "Whitelist retirée",
    description: `L'équipe de Néa Hélikè t'a retiré ta whitelist : tu retrouves le rôle **Novice**.\n\nTu peux déposer une nouvelle candidature dès maintenant sur le portail : ${url}`,
    color: EMBED_DANGER,
    fields: reason ? [{ name: "Raison", value: reason.slice(0, 1000) }] : [],
    footer,
  }),
  blacklist: ({ reason }: { reason: string | null }): Embed => ({
    title: "Blacklist",
    description: "Tu es blacklist de Néa Hélikè : tu es banni du Discord et tu n'as plus accès au portail.",
    color: EMBED_DANGER,
    fields: reason ? [{ name: "Raison", value: reason.slice(0, 1000) }] : [],
    footer,
  }),
  delaiLeve: ({ url }: { url: string }): Embed => ({
    title: "Délai levé",
    description: `L'équipe de Néa Hélikè a levé ton délai de 3 mois : tu peux déposer une nouvelle candidature dès maintenant sur le portail : ${url}`,
    color: EMBED_COLOR,
    footer,
  }),
  rouverte: (): Embed => ({
    title: "Candidature rouverte",
    description: "L'équipe de Néa Hélikè a annulé le refus de ta candidature : elle est de nouveau en cours de lecture. Tu seras prévenu ici de la suite.",
    color: EMBED_COLOR,
    footer,
  }),
  dossierAccepte: ({ target, comment }: { target: string; comment: string }): Embed => ({
    title: "Dossier de reprise accepté",
    description: `L'équipe de Néa Hélikè a accepté ton dossier de reprise : **${target}**.`,
    color: EMBED_SUCCESS,
    fields: comment ? [{ name: "Message de l'équipe", value: comment.slice(0, 1000) }] : [],
    footer,
  }),
  dossierRefuse: ({ target, comment }: { target: string; comment: string }): Embed => ({
    title: "Dossier de reprise refusé",
    description: `L'équipe de Néa Hélikè a refusé ton dossier de reprise : **${target}**. Tu peux en déposer un autre depuis le portail.`,
    color: EMBED_DANGER,
    fields: comment ? [{ name: "Message de l'équipe", value: comment.slice(0, 1000) }] : [],
    footer,
  }),
  wipeInvitation: ({ url }: { url: string }): Embed => ({
    title: "Wipe de personnage",
    description: `Un admin de Néa Hélikè t'invite à refaire ton personnage. Remplis ton nouveau personnage et son background sur le portail, puis envoie ta demande : ${url}\n\nTa partie HRP ne change pas.`,
    color: EMBED_COLOR,
    footer,
  }),
  wipeAcceptee: ({ comment }: { comment: string }): Embed => ({
    title: "Wipe accepté",
    description: "Ton wipe est accepté : ton nouveau personnage remplace l'ancien. Bon jeu à Néa Hélikè.",
    color: EMBED_SUCCESS,
    fields: comment ? [{ name: "Message de l'équipe", value: comment.slice(0, 1000) }] : [],
    footer,
  }),
  wipeRefusee: ({ comment }: { comment: string }): Embed => ({
    title: "Wipe refusé",
    description: "Un admin a refusé ta demande de wipe : ton personnage actuel reste.",
    color: EMBED_DANGER,
    fields: comment ? [{ name: "Message de l'équipe", value: comment.slice(0, 1000) }] : [],
    footer,
  }),
  whitelistee: (): Embed => ({
    title: "Bienvenue à Néa Hélikè",
    description: "Ton entretien est validé : tu es whitelist et tu as reçu le rôle **Magistrat**. La cité t'attend.",
    color: EMBED_SUCCESS,
    footer,
  }),
};
