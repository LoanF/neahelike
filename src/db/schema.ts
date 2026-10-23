import { sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/** Rangs du site : joueur < recruteur < admin < owner. */
export const rank = pgEnum("rank", ["joueur", "recruteur", "admin", "owner"]);
export type Rank = (typeof rank.enumValues)[number];

/**
 * Un compte par utilisateur Discord. L'identifiant est l'ID Discord.
 * Le rang n'est jamais une source de vérité : il est recalculé depuis les rôles Discord (voir lib/members.ts).
 */
export const users = pgTable("users", {
  id: text().primaryKey(),
  username: text().notNull(),
  globalName: text(),
  avatar: text(),
  banner: text(),
  rank: rank().notNull().default("joueur"),
  inGuild: boolean().notNull().default(false),
  rolesSyncedAt: timestamp({ withTimezone: true }),
  cguAcceptedAt: timestamp({ withTimezone: true }),
  cguVersion: text(),
  lastLoginAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;

/**
 * Journal : chaque étape d'un joueur et chaque action de l'équipe.
 * `subjectId` = le joueur concerné, `actorId` = qui a agi (lui-même ou un membre de l'équipe).
 * À la suppression d'un compte, les lignes restent mais perdent le lien (anonymisation).
 */
export const events = pgTable(
  "events",
  {
    id: uuid().primaryKey().defaultRandom(),
    subjectId: text().references(() => users.id, { onDelete: "set null" }),
    actorId: text().references(() => users.id, { onDelete: "set null" }),
    type: text().notNull(),
    data: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  table => [index("events_subject_idx").on(table.subjectId, table.createdAt), index("events_created_idx").on(table.createdAt)],
);

export type EventRow = typeof events.$inferSelect;

/**
 * Statuts d'une candidature :
 * brouillon → envoyee → (a_modifier → envoyee) → entretien (écrit validé, rôle « attente de wl ») → whitelistee,
 * ou refusee à tout moment après l'envoi.
 */
export const applicationStatus = pgEnum("application_status", ["brouillon", "envoyee", "a_modifier", "entretien", "whitelistee", "refusee"]);
export type ApplicationStatus = (typeof applicationStatus.enumValues)[number];

/** Valeurs brutes d'une étape du formulaire, telles que saisies (voir lib/application.ts). */
export type StepValues = Record<string, string | boolean | null>;

/**
 * Candidatures whitelist. Un joueur n'a qu'une candidature ouverte à la fois ;
 * les candidatures refusées ou abouties restent pour l'historique.
 */
export const applications = pgTable(
  "applications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: applicationStatus().notNull().default("brouillon"),
    hrp: jsonb().$type<StepValues>(),
    rp: jsonb().$type<StepValues>(),
    background: jsonb().$type<StepValues>(),
    dossier: jsonb().$type<StepValues>(),
    submittedAt: timestamp({ withTimezone: true }),
    /** Première ouverture par l'équipe depuis le dernier envoi (badge « Vue »). */
    viewedAt: timestamp({ withTimezone: true }),
    /** Dernier membre de l'équipe à avoir pris une décision. */
    reviewerId: text().references(() => users.id, { onDelete: "set null" }),
    /** Modification demandée : étapes rouvertes et message au joueur. */
    changesSteps: text().array(),
    changesComment: text(),
    /** Refus : critères cochés (voir content/equipe.ts) et commentaire. */
    refusalCriteria: text().array(),
    refusalComment: text(),
    decidedAt: timestamp({ withTimezone: true }),
    /**
     * Whitelist retirée par un admin : la candidature reste « whitelistee » pour l'historique, mais ne bloque plus
     * une nouvelle candidature. Raison facultative, montrée au joueur.
     */
    whitelistRevokedAt: timestamp({ withTimezone: true }),
    whitelistRevokedById: text().references(() => users.id, { onDelete: "set null" }),
    whitelistRevokeReason: text(),
    /** Validation écrite : créneau de la prochaine session de whitelist, choisi par le recruteur et envoyé au joueur. */
    interviewSlotStart: timestamp({ withTimezone: true }),
    interviewSlotEnd: timestamp({ withTimezone: true }),
    /** Refus : délai de recandidature levé par un admin, le joueur peut recommencer tout de suite. */
    reapplyLiftedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  table => [
    index("applications_user_idx").on(table.userId, table.createdAt),
    uniqueIndex("applications_user_open_idx")
      .on(table.userId)
      .where(sql`${table.status} not in ('whitelistee', 'refusee')`),
  ],
);

export type Application = typeof applications.$inferSelect;

/**
 * Dossier de reprise déposé à part, après une candidature envoyée sans dossier :
 * brouillon (en cours de saisie) → envoye → accepte ou refuse par l'équipe.
 */
export const takeoverStatus = pgEnum("takeover_status", ["brouillon", "envoye", "accepte", "refuse"]);
export type TakeoverStatus = (typeof takeoverStatus.enumValues)[number];

export const takeoverDossiers = pgTable(
  "takeover_dossiers",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Candidature à laquelle le dossier se rattache. */
    applicationId: uuid().references(() => applications.id, { onDelete: "set null" }),
    status: takeoverStatus().notNull().default("brouillon"),
    /** Mêmes champs que l'étape « dossier » de la candidature (voir lib/application.ts). */
    content: jsonb().$type<StepValues>(),
    reviewerId: text().references(() => users.id, { onDelete: "set null" }),
    /** Message de l'équipe au joueur, avec la décision. */
    comment: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp({ withTimezone: true }),
    decidedAt: timestamp({ withTimezone: true }),
  },
  table => [
    index("takeover_dossiers_user_idx").on(table.userId, table.createdAt),
    uniqueIndex("takeover_dossiers_user_open_idx")
      .on(table.userId)
      .where(sql`${table.status} in ('brouillon', 'envoye')`),
  ],
);

export type TakeoverDossier = typeof takeoverDossiers.$inferSelect;

/**
 * Wipe de personnage (joueur whitelist) : ouverte (le joueur remplit son nouveau personnage, de lui-même ou invité
 * par un admin) → envoyee → acceptee (le nouveau personnage remplace l'ancien) ou refusee.
 * Visible seulement par les admins et owners (onglet Wipe), jamais sur la fiche du joueur.
 */
export const wipeStatus = pgEnum("wipe_status", ["ouverte", "envoyee", "acceptee", "refusee"]);
export type WipeStatus = (typeof wipeStatus.enumValues)[number];

export const wipeRequests = pgTable(
  "wipe_requests",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: wipeStatus().notNull().default("ouverte"),
    /** Nouveau personnage : mêmes champs que les étapes « rp » et « background » de la candidature. */
    rp: jsonb().$type<StepValues>(),
    background: jsonb().$type<StepValues>(),
    /** Admin qui a invité le joueur à faire sa demande (null : demande du joueur lui-même). */
    invitedById: text().references(() => users.id, { onDelete: "set null" }),
    reviewerId: text().references(() => users.id, { onDelete: "set null" }),
    comment: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp({ withTimezone: true }),
    decidedAt: timestamp({ withTimezone: true }),
  },
  table => [
    index("wipe_requests_user_idx").on(table.userId, table.createdAt),
    uniqueIndex("wipe_requests_user_open_idx")
      .on(table.userId)
      .where(sql`${table.status} in ('ouverte', 'envoyee')`),
  ],
);

export type WipeRequest = typeof wipeRequests.$inferSelect;

/** `equipe` : recruteurs et admins ; `admin` : admins uniquement. */
export const noteVisibility = pgEnum("note_visibility", ["equipe", "admin"]);
export type NoteVisibility = (typeof noteVisibility.enumValues)[number];

/** Notes internes sur un joueur, jamais visibles par le joueur. */
// Table nommée « staff_notes » en base (nom connu du bot), « teamNotes » dans le code.
export const teamNotes = pgTable(
  "staff_notes",
  {
    id: uuid().primaryKey().defaultRandom(),
    subjectId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    authorId: text().references(() => users.id, { onDelete: "set null" }),
    visibility: noteVisibility().notNull().default("equipe"),
    content: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  table => [index("staff_notes_subject_idx").on(table.subjectId, table.createdAt)],
);

export type TeamNote = typeof teamNotes.$inferSelect;

/** Qui consulte quelle fiche en ce moment (œil de présence) : une ligne par couple, rafraîchie toutes les quelques secondes. */
export const profileViews = pgTable(
  "profile_views",
  {
    subjectId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    viewerId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  table => [primaryKey({ columns: [table.subjectId, table.viewerId] })],
);

/** Notifications du portail (cloche) : décisions de l'équipe sur la candidature du joueur. */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text().notNull(),
    title: text().notNull(),
    body: text().notNull(),
    /** Page à ouvrir au clic. */
    href: text(),
    readAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  table => [index("notifications_user_idx").on(table.userId, table.createdAt)],
);

export type Notification = typeof notifications.$inferSelect;

/**
 * Délai de recandidature conservé après la suppression d'un compte refusé : seulement l'ID Discord
 * et la date de fin, pour faire respecter les 3 mois. La ligne est inutile (et purgée) une fois la date passée.
 */
export const reapplyLocks = pgTable("reapply_locks", {
  discordId: text().primaryKey(),
  until: timestamp({ withTimezone: true }).notNull(),
});

/**
 * Compteurs de la limite d'envoi (lib/rate-limit.ts) : une ligne par membre et par action,
 * remise à zéro à `resetAt`. Les lignes expirées sont purgées au fil de l'eau.
 */
export const rateLimits = pgTable("rate_limits", {
  key: text().primaryKey(),
  count: integer().notNull(),
  resetAt: timestamp({ withTimezone: true }).notNull(),
});

/**
 * Blacklist, partagée par le site et le bot : un ID Discord présent ici n'a plus accès au portail
 * (page de blocage dès la connexion, même sans compte sur le site) et est banni du Discord.
 * Pas de clé étrangère vers `users` : le bot peut blacklister quelqu'un qui ne s'est jamais connecté.
 * Lever la blacklist supprime la ligne ; l'historique reste dans `events`.
 */
export const blacklist = pgTable("blacklist", {
  discordId: text().primaryKey(),
  /** Raison facultative, affichée au joueur sur sa page de blocage. */
  reason: text(),
  /** ID Discord de l'admin ou du modérateur qui a blacklisté. */
  createdById: text().notNull(),
  /** Origine : depuis le site ou depuis la commande /blacklist du bot. */
  source: text().notNull().default("site"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type BlacklistEntry = typeof blacklist.$inferSelect;

/** Owners ajoutés depuis le site, en plus des owners permanents (content/owners.ts). */
export const siteOwners = pgTable("site_owners", {
  discordId: text().primaryKey(),
  addedById: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/**
 * Rang donné par un rôle Discord, réglé par les owners. Un rôle absent de la table ne donne que le rang joueur ;
 * le rang owner ne se donne jamais par un rôle.
 */
export const roleRanks = pgTable(
  "role_ranks",
  {
    roleId: text().primaryKey(),
    rank: rank().notNull(),
    updatedById: text(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  // Les rôles « joueur » sont aussi enregistrés : une table non vide veut dire « réglé depuis le site »,
  // même si plus aucun rôle ne donne de droits (sinon on retomberait sur les variables d'environnement).
  table => [check("role_ranks_pas_owner", sql`${table.rank} in ('joueur', 'recruteur', 'admin')`)],
);

export const factionKind = pgEnum("faction_kind", ["affinite", "creature"]);
export type FactionKind = (typeof factionKind.enumValues)[number];

/**
 * Affinités et créatures. Celles d'origine gardent leur lore dans content/lore.ts (`lore` vide) ;
 * celles ajoutées depuis l'administration portent leur lore ici.
 * Deux disponibilités distinctes : rejoindre (`joinOpen`) et reprendre le lead (`leadOpen`).
 */
export const factions = pgTable("factions", {
  id: text().primaryKey(),
  kind: factionKind().notNull(),
  sortOrder: integer().notNull().default(0),
  joinOpen: boolean().notNull().default(true),
  leadOpen: boolean().notNull().default(true),
  /** Archivée : masquée partout, mais toujours lisible dans les anciennes candidatures. */
  archived: boolean().notNull().default(false),
  lore: jsonb().$type<Record<string, string | boolean>>(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Faction = typeof factions.$inferSelect;

/** Entreprises de la cité qu'un joueur peut reprendre avec un dossier ; `open` = encore disponible. */
export const businesses = pgTable("businesses", {
  id: text().primaryKey(),
  name: text().notNull(),
  description: text().notNull().default(""),
  open: boolean().notNull().default(true),
  sortOrder: integer().notNull().default(0),
  archived: boolean().notNull().default(false),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Business = typeof businesses.$inferSelect;

/** Critères de refus proposés à l'équipe ; un critère désactivé reste lisible dans les anciens refus. */
export const refusalCriteria = pgTable("refusal_criteria", {
  id: text().primaryKey(),
  label: text().notNull(),
  sortOrder: integer().notNull().default(0),
  active: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type RefusalCriterion = typeof refusalCriteria.$inferSelect;

// ─── Bot Discord (dépôt bot-neahelike) ──────────────────────────────────────
// Tables écrites uniquement par le bot. Le site ne fait que les lire, s'il en a besoin.

/** Configuration du bot, une ligne par serveur Discord. */
export const botGuildConfig = pgTable("bot_guild_config", {
  guildId: text().primaryKey(),
  prefix: text().notNull().default("+"),
  embedColor: text().notNull().default("#d1a64a"),
  embedColorDark: text().notNull().default("#1a150f"),
  embedColorLight: text().notNull().default("#f1ece2"),
  nickname: text(),
  bio: text(),
  avatarUrl: text(),
  bannerUrl: text(),
  presenceStatus: text().notNull().default("online"),
  activityType: text().notNull().default("personnalise"),
  activityText: text(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Niveaux de permission : un niveau de poids supérieur hérite des droits des niveaux inférieurs. */
export const botPermissionLevels = pgTable(
  "bot_permission_levels",
  {
    id: uuid().primaryKey().defaultRandom(),
    guildId: text().notNull(),
    name: text().notNull(),
    weight: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  table => [unique().on(table.guildId, table.name), unique().on(table.guildId, table.weight)],
);

/** Rôles Discord liés à un niveau (plusieurs rôles par niveau). */
export const botPermissionLevelRoles = pgTable(
  "bot_permission_level_roles",
  {
    levelId: uuid()
      .notNull()
      .references(() => botPermissionLevels.id, { onDelete: "cascade" }),
    roleId: text().notNull(),
  },
  table => [primaryKey({ columns: [table.levelId, table.roleId] })],
);

/** État et réglages de chaque module. `levelId` : rang requis pour tout le module (null = valeur de chaque commande). */
export const botModules = pgTable(
  "bot_modules",
  {
    guildId: text().notNull(),
    module: text().notNull(),
    enabled: boolean().notNull().default(true),
    levelId: uuid().references(() => botPermissionLevels.id, { onDelete: "set null" }),
    settings: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  table => [primaryKey({ columns: [table.guildId, table.module] })],
);

/** Rang requis par commande. `levelId` null = ouverte à tout le monde ; supprimer le niveau supprime le réglage. */
export const botCommandPermissions = pgTable(
  "bot_command_permissions",
  {
    guildId: text().notNull(),
    command: text().notNull(),
    levelId: uuid().references(() => botPermissionLevels.id, { onDelete: "cascade" }),
  },
  table => [primaryKey({ columns: [table.guildId, table.command] })],
);

/** Textes personnalisés ; sans ligne, le bot utilise son texte par défaut. */
export const botMessages = pgTable(
  "bot_messages",
  {
    guildId: text().notNull(),
    key: text().notNull(),
    content: text().notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  table => [primaryKey({ columns: [table.guildId, table.key] })],
);

export const ticketStatus = pgEnum("ticket_status", ["ouvert", "ferme"]);

/** Tickets du bot Discord : un salon privé par demande, avec sa transcription à la fermeture. */
export const botTickets = pgTable(
  "bot_tickets",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Numéro lisible du ticket (#0042), attribué par la base. */
    number: integer().generatedAlwaysAsIdentity(),
    guildId: text().notNull(),
    channelId: text().notNull().unique(),
    /** Identifiant de la catégorie dans les réglages du module, et son nom au moment de l'ouverture. */
    categoryId: text().notNull(),
    categoryLabel: text().notNull(),
    openerId: text().notNull(),
    claimedById: text(),
    status: ticketStatus().notNull().default("ouvert"),
    /** Réponses au formulaire d'ouverture. */
    answers: jsonb().$type<{ question: string; answer: string }[]>().notNull().default([]),
    closeReason: text(),
    closedById: text(),
    /** Transcription HTML enregistrée à la fermeture. */
    transcript: text(),
    /** Note de satisfaction de 1 à 5, donnée en MP après la fermeture. */
    rating: integer(),
    lastActivityAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp({ withTimezone: true }),
  },
  table => [
    // Un seul ticket ouvert par membre et par catégorie.
    uniqueIndex("bot_tickets_un_ouvert_par_categorie").on(table.guildId, table.openerId, table.categoryId).where(sql`${table.status} = 'ouvert'`),
    index("bot_tickets_inactifs_idx").on(table.status, table.lastActivityAt),
    check("bot_tickets_note", sql`${table.rating} between 1 and 5`),
  ],
);

export const giveawayStatus = pgEnum("giveaway_status", ["en_cours", "termine", "annule"]);

/** Giveaways du bot : publiés dans un salon, tirés au sort à leur fin. */
export const botGiveaways = pgTable(
  "bot_giveaways",
  {
    id: uuid().primaryKey().defaultRandom(),
    guildId: text().notNull(),
    channelId: text().notNull(),
    /** Message publié ; null le temps de l'envoyer. */
    messageId: text().unique(),
    prize: text().notNull(),
    description: text(),
    winnerCount: integer().notNull().default(1),
    /** Rôle exigé pour participer ; null : tout le monde. */
    requiredRoleId: text(),
    hostId: text().notNull(),
    status: giveawayStatus().notNull().default("en_cours"),
    /** Gagnants tirés à la fin (ou au nouveau tirage). */
    winnerIds: text().array().notNull().default(sql`'{}'::text[]`),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp({ withTimezone: true }),
  },
  table => [
    index("bot_giveaways_a_terminer_idx").on(table.status, table.endsAt),
    check("bot_giveaways_gagnants", sql`${table.winnerCount} between 1 and 20`),
  ],
);

/** Participants d'un giveaway. */
export const botGiveawayEntries = pgTable(
  "bot_giveaway_entries",
  {
    giveawayId: uuid()
      .notNull()
      .references(() => botGiveaways.id, { onDelete: "cascade" }),
    userId: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  table => [primaryKey({ columns: [table.giveawayId, table.userId] })],
);

export const sanctionType = pgEnum("sanction_type", ["avertissement", "exclusion", "expulsion", "bannissement"]);

/** Casier de modération du bot : une ligne par sanction, jamais supprimée (une sanction levée est marquée révoquée). */
export const botSanctions = pgTable(
  "bot_sanctions",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Numéro lisible de la sanction (#12), attribué par la base. */
    number: integer().generatedAlwaysAsIdentity(),
    guildId: text().notNull(),
    /** ID Discord du membre sanctionné (pas de clé étrangère : il peut ne pas avoir de compte sur le site). */
    userId: text().notNull(),
    moderatorId: text().notNull(),
    type: sanctionType().notNull(),
    reason: text().notNull(),
    /** Fin d'une exclusion temporaire ou d'un bannissement temporaire ; null : définitif ou sans durée. */
    endsAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    /** Sanction levée (débannissement, avertissement retiré, fin anticipée). */
    revokedAt: timestamp({ withTimezone: true }),
    revokedById: text(),
    revokeReason: text(),
  },
  table => [
    index("bot_sanctions_casier_idx").on(table.guildId, table.userId, table.createdAt),
    // Bannissements temporaires encore actifs, levés automatiquement à échéance.
    index("bot_sanctions_bans_a_lever_idx")
      .on(table.endsAt)
      .where(sql`${table.type} = 'bannissement' and ${table.revokedAt} is null and ${table.endsAt} is not null`),
  ],
);
