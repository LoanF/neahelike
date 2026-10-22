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
  validee: (): Embed => ({
    title: "Candidature validée",
    description:
      "Ta candidature écrite à Néa Hélikè est validée.\n\nTu as reçu le rôle **attente de wl** : rejoins un salon d'attente vocal sur le Discord pour passer ton entretien.",
    color: EMBED_COLOR,
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
  whitelistee: (): Embed => ({
    title: "Bienvenue à Néa Hélikè",
    description: "Ton entretien est validé : tu es whitelist et tu as reçu le rôle **Magistrat**. La cité t'attend.",
    color: EMBED_SUCCESS,
    footer,
  }),
};
