/*
 * Lore de Néa Hélikè. Source : le texte du lore et les diapos de docs/lore/.
 * Pour corriger un texte, modifier ce fichier : toutes les pages se mettent à jour.
 */
import type { EmblemName } from "@/components/site/emblem";

/* ---------- La cité ---------- */

export const ORIGINS = [
  {
    date: "373 av. J.-C.",
    label: "La chute",
    text: "En une seule nuit d'hiver, un tremblement de terre détruit Hélikè, cité grecque d'Achaïe, puis la mer l'engloutit. Les Anciens y voient la colère de Poséidon : ses habitants auraient profané son sanctuaire.",
  },
  {
    date: "372 av. J.-C.",
    label: "La fondation",
    text: "Guidés par une lueur sur l'eau, les rares survivants accostent sur une terre inconnue, entre un lac sacré et un fleuve sombre. Ils y fondent Néa Hélikè, la « Nouvelle Hélikè », et jurent de ne plus jamais offenser les dieux.",
  },
  {
    date: "360 av. J.-C.",
    label: "Aujourd'hui",
    text: "La cité a douze ans. Elle grandit vite… mais les dieux la surveillent encore.",
  },
] as const;

export const TIMELINE = [
  { year: "~1184", event: "Chute de Troie" },
  { year: "373", event: "Hélikè est engloutie par la mer" },
  { year: "372", event: "Fondation de Néa Hélikè" },
  { year: "368", event: "Construction du Labyrinthe" },
  { year: "365", event: "Premiers Jeux Helikonios au Stade" },
  { year: "360", event: "Époque actuelle", current: true },
] as const;

export const PLACES: { name: string; text: string; emblem: EmblemName }[] = [
  { name: "Naos de Poséidon", text: "Le temple où l'on implore le pardon du dieu.", emblem: "temple" },
  { name: "Flamme d'Hestia", text: "Le foyer sacré ramené d'Hélikè. Il ne doit jamais s'éteindre.", emblem: "hearth" },
  { name: "Colosse de Poséidon", text: "La statue géante sur la colline de terre rouge.", emblem: "statue" },
  { name: "Agora", text: "Le marché et les annonces publiques.", emblem: "scales" },
  { name: "Stade Helikonios", text: "Les jeux en l'honneur de Poséidon, et les duels.", emblem: "laurel" },
  { name: "Trapeza", text: "La banque, où l'on change et prête drachmes et oboles.", emblem: "coin" },
  { name: "Forge d'Héphaïstos", text: "Armes, outils et bronze.", emblem: "hammer" },
  { name: "Bois sacré d'Artémis", text: "Chasse interdite sans offrande.", emblem: "moon" },
  { name: "Oracle de la Source", text: "Une Pythie y rend les prophéties d'Apollon.", emblem: "eye" },
  { name: "Bras de l'Achéron", text: "La rivière qui rejoindrait le monde des morts.", emblem: "river" },
];

export const OTHER_PLACES = "Et aussi : le port, la taverne, les bains, le symposion, la nécropole… Tout est sur la carte.";

/* ---------- Les dieux ---------- */

export const CITY_GOD = {
  name: "Poséidon",
  domain: "Le dieu de la cité",
  text: "Craint et vénéré : c'est pour l'apaiser que la cité existe. Son naos, son colosse et les jeux du Stade Helikonios lui sont consacrés.",
  emblem: "trident" as EmblemName,
};

export const GODS: { name: string; domain: string; text: string; emblem: EmblemName }[] = [
  { name: "Déméter", domain: "Les récoltes", text: "Veille sur les jardins et les champs qui nourrissent la cité.", emblem: "wheat" },
  { name: "Héphaïstos", domain: "La forge", text: "Sa forge façonne les armes, les outils et le bronze.", emblem: "hammer" },
  { name: "Artémis", domain: "La forêt", text: "Nul ne chasse dans son bois sacré sans offrande.", emblem: "moon" },
  { name: "Hadès & Hermès", domain: "Les morts et leur passage", text: "Une obole pour Charon, sinon l'errance au bord de l'Achéron.", emblem: "coin" },
  { name: "Dionysos", domain: "Les fêtes et le vin", text: "Il règne sur le symposion, ses banquets et ses excès.", emblem: "cup" },
];

export const OTHER_GODS = ["Hestia", "Apollon", "Zeus", "Athéna", "Thémis", "Asclépios"];

/* ---------- L'Assemblée des Cinq ---------- */

export const ASSEMBLY_INTRO =
  "Ici, ni roi ni chef. Autour de la Table d'Olympe, une grande table ronde de marbre, siègent cinq conseillers égaux. Chaque voix compte autant que les autres.";

export const POLES: { pole: string; god: string; text: string; emblem: EmblemName }[] = [
  { pole: "Santé", god: "Asclépios", text: "Soigneurs, remèdes et bains de guérison.", emblem: "baton" },
  { pole: "Justice", god: "Thémis", text: "Fait respecter les lois, juge les conflits et sanctionne.", emblem: "scales" },
  { pole: "Économie", god: "Hermès", text: "Commerce, métiers, banque, entrepôt et ressources.", emblem: "coin" },
  { pole: "Social", god: "Hestia", text: "Concorde, fêtes et accueil des nouveaux arrivants.", emblem: "hearth" },
  { pole: "Protection", god: "Athéna", text: "Garde, murailles et tours de guet.", emblem: "shield" },
];

export const RANKS = [
  { name: "Conseiller", text: "Dirige le pôle, siège à la Table d'Olympe." },
  { name: "Épistate", text: "Bras droit du conseiller, le remplace en son absence." },
  { name: "Magistrat", text: "Membre confirmé, applique les décisions du pôle." },
  { name: "Novice", text: "Nouveau membre en formation." },
] as const;

export const LAW_STEPS = [
  "Les citoyens proposent leurs idées à l'Assemblée.",
  "Les cinq conseillers en débattent autour de la Table d'Olympe.",
  "Chaque conseiller vote, et chaque voix a la même valeur.",
  "La loi est adoptée si au moins 3 conseillers sur 5 votent pour.",
] as const;

export const JUDGEMENT = {
  intro: "Chaque année, un grand rituel d'une semaine désigne les cinq nouveaux membres de la Table d'Olympe.",
  conditions: [
    { text: "Des offrandes suffisantes à Poséidon", emblem: "trident" as EmblemName },
    { text: "Un métier officiel dans la cité", emblem: "hammer" as EmblemName },
  ],
  physical: ["Endurance", "Force", "Courage", "Survie"],
  mental: ["Énigmes", "Sagesse", "Choix moraux", "Prise de parole"],
  final: "Le dernier jour, les candidats restants se présentent devant l'autel sacré. Les dieux rendent leur jugement et désignent cinq élus, un pour chaque pôle.",
  outcome: "Les cinq élus siègent à la Table d'Olympe pour un an.",
};

/* ---------- Affinités ---------- */

export type AffinityId = "fendeciels" | "abyssiens" | "toxotes" | "ardents" | "guerriers";

export interface Affinity {
  id: AffinityId;
  name: string;
  god: string;
  /** Libellé court de l'élément (badge des cartes). */
  element: string;
  values: string;
  text: string;
  /** Phrase d'accroche des cartes de l'accueil. */
  hook: string;
  emblem: EmblemName;
  /** Prompt de l'illustration à produire. */
  art: string;
  divine: boolean;
}

export const AFFINITIES: Affinity[] = [
  {
    id: "fendeciels",
    name: "Fendeciels",
    god: "Zeus",
    element: "Foudre",
    values: "Autorité · honneur · justice divine",
    text: "Gardiens des traditions et des rituels sacrés, ils veillent au respect des dieux.",
    hook: "Ils sentent l'orage avant qu'il éclate, et certains savent l'appeler.",
    emblem: "bolt",
    art: "Fendeciel : guerrier ou guerrière en pied, éclairs dans la main, ciel d'orage",
    divine: true,
  },
  {
    id: "abyssiens",
    name: "Abyssiens",
    god: "Poséidon",
    element: "Eau",
    values: "Liberté · force · loyauté",
    text: "Marins, pêcheurs et protecteurs du port, ils gèrent les offrandes faites à Poséidon.",
    hook: "Ils respirent sous l'eau plus longtemps que les autres et commandent aux courants.",
    emblem: "waves",
    art: "Abyssien : figure en pied avec trident, vague dressée derrière",
    divine: true,
  },
  {
    id: "toxotes",
    name: "Toxotes",
    god: "Artémis",
    element: "Lumière",
    values: "Nature · indépendance · protection",
    text: "Chasseurs et éclaireurs, ils protègent les forêts, les champs et les routes autour de la cité.",
    hook: "Archers de la nuit. Ils voient dans le noir et ne manquent jamais deux fois.",
    emblem: "moon",
    art: "Toxote : archère en pied, arc tendu, pleine lune",
    divine: true,
  },
  {
    id: "ardents",
    name: "Ardents",
    god: "Héphaïstos",
    element: "Feu",
    values: "Travail · savoir-faire · persévérance",
    text: "Artisans et forgerons, ils entretiennent la forge sacrée et fabriquent armes, outils et offrandes.",
    hook: "Forgerons qui travaillent le métal à mains nues. La braise ne les brûle pas.",
    emblem: "flame",
    art: "Ardent : forgeron en pied, marteau, braises et étincelles",
    divine: true,
  },
  {
    id: "guerriers",
    name: "Guerriers",
    god: "Sans dieu",
    element: "Aucun pouvoir",
    values: "Courage · discipline · parole donnée",
    text: "Aucun dieu ne les a choisis, et ils n'ont aucun pouvoir. Ils servent la cité par le bouclier, la lance et leur parole.",
    hook: "Aucun dieu ne les a choisis. Ils ont le bouclier, la lance et leur parole.",
    emblem: "shield",
    art: "Guerrier : hoplite en pied, bouclier rond, lance, cape usée",
    divine: false,
  },
];

export const AFFINITY_INTRO =
  "Chaque habitant peut s'engager auprès d'un dieu et rejoindre son affinité : une faction qui partage ses valeurs et le sert dans la cité.";

export const AFFINITY_RULES = [
  "Un humain ne peut rejoindre qu'une seule affinité à la fois.",
  "Pour y entrer, il faut être accepté par son prêtre.",
  "Le prêtre est choisi par le dieu ; il mène les louanges et les rituels de donation.",
  "Un conseiller peut appartenir à une affinité, mais reste neutre à la Table d'Olympe.",
] as const;

/* ---------- Créatures ---------- */

export type CreatureId = "minotaures" | "colosses" | "centaures" | "sirenes" | "satyres";

export interface Creature {
  id: CreatureId;
  name: string;
  origin: string;
  /** Origine en deux ou trois mots, pour les tuiles de l'accueil. */
  originShort: string;
  strengths: string;
  strengthShort: string;
  weaknesses: string;
  weaknessShort: string;
  friendly: string;
  emblem: EmblemName;
  art: string;
}

export const CREATURES: Creature[] = [
  {
    id: "minotaures",
    name: "Minotaures",
    origin: "Nés au fond du Labyrinthe, ils en sont sortis par les galeries des mines.",
    originShort: "Le Labyrinthe",
    strengths: "Force brute, charge dévastatrice, orientation parfaite sous terre.",
    strengthShort: "Force brute",
    weaknesses: "Colère difficile à contenir, peu agiles, mal à l'aise à découvert.",
    weaknessShort: "Le grand soleil",
    friendly: "Les Ombres d'Hadès",
    emblem: "bull",
    art: "Minotaure en pied, armure de bronze, hache double, contre-jour doré",
  },
  {
    id: "colosses",
    name: "Colosses",
    origin: "Façonnés par Héphaïstos pour garder les côtes, ils ont gagné une étincelle de conscience.",
    originShort: "La forge d'Héphaïstos",
    strengths: "Corps de bronze ou de pierre, feu intérieur, presque infatigables.",
    strengthShort: "Endurance",
    weaknesses: "Lents et lourds, ils coulent. Si leur feu s'éteint, ils se figent.",
    weaknessShort: "L'eau",
    friendly: "Les Forgés d'Héphaïstos",
    emblem: "colossus",
    art: "Colosse de bronze vert-de-gris, debout dans le port, feu intérieur visible",
  },
  {
    id: "centaures",
    name: "Centaures",
    origin: "Issus des tribus sauvages des montagnes, certains ont été élevés par le sage Chiron.",
    originShort: "Les montagnes",
    strengths: "Course fulgurante, tir à l'arc précis, plantes qui soignent.",
    strengthShort: "Vitesse, savoir",
    weaknesses: "Le vin les rend incontrôlables ; murs et ruelles les oppressent.",
    weaknessShort: "Le vin",
    friendly: "Les Chasseresses de la Lune",
    emblem: "bow",
    art: "Centaure archer au galop, arc bandé, forêt au crépuscule",
  },
  {
    id: "sirenes",
    name: "Sirènes",
    origin: "Filles des flots, certaines marchent sur terre depuis une tempête envoyée par Poséidon.",
    originShort: "Les flots",
    strengths: "Chant envoûtant, respiration sous l'eau, nage très rapide.",
    strengthShort: "Le chant",
    weaknesses: "Faiblissent loin de l'eau ; chant sans effet sur les oreilles bouchées.",
    weaknessShort: "Loin de la mer",
    friendly: "Les Enfants des Marées",
    emblem: "shell",
    art: "Sirène sur un rocher, au bord de l'eau, lumière de lune",
  },
  {
    id: "satyres",
    name: "Satyres",
    origin: "Mi-hommes, mi-boucs, compagnons des fêtes divines venus chercher la fête en ville.",
    originShort: "Les fêtes divines",
    strengths: "Flûte magique, agilité en terrain difficile, sauts impressionnants.",
    strengthShort: "Ruse, musique",
    weaknesses: "Peu fiables, vite distraits, très sensibles aux excès.",
    weaknessShort: "Les excès",
    friendly: "Les Cœurs d'Aphrodite",
    emblem: "pipes",
    art: "Satyre jouant de l'aulos, sous une treille, lumière de banquet",
  },
];

export const CREATURE_INTRO =
  "Nées de la volonté des dieux bien avant la cité, certaines vivent aujourd'hui parmi les citoyens. Ni clan, ni meute, ni chef : chacune trace sa propre route.";

export const CREATURE_RULES =
  "Solitaires au départ, sans groupe ni chef. Libres de rejoindre une affinité divine comme tout citoyen. L'affinité amicale dit seulement avec qui elles s'entendent, sans obligation. Leurs liens restent à découvrir.";

/* ---------- Légendes ---------- */

export const LEGENDS: { name: string; text: string; coda: string; emblem: EmblemName }[] = [
  {
    name: "Le Labyrinthe d'Ikarion",
    text: "La nuit où Hélikè a sombré, un veau est né dans la cale d'un navire rescapé, comme le Minotaure né jadis de la colère de Poséidon. Devenu bête, il a été enfermé dans le dédale bâti par Ikarion, descendant de Dédale.",
    coda: "Nul ne sait s'il est encore vivant.",
    emblem: "labyrinth",
  },
  {
    name: "L'Oracle de la Source",
    text: "Au cœur de la forêt, une jeune femme respire les vapeurs d'une faille rocheuse et parle au nom d'Apollon.",
    coda: "Ses prophéties sont toujours vraies, mais jamais claires.",
    emblem: "eye",
  },
  {
    name: "Le Bras de l'Achéron",
    text: "Les morts de la cité sont enterrés avec une obole sous la langue, pour payer Charon. Ceux qu'on enterre sans pièce errent le long de la rivière, près de la nécropole.",
    coda: "Sans obole, pas de passage.",
    emblem: "river",
  },
  {
    name: "Le Colosse",
    text: "Les habitants en sont sûrs : tant que la statue de Poséidon reste debout, le dieu épargne la cité.",
    coda: "Si elle tombe, les flots reviendront.",
    emblem: "statue",
  },
];
