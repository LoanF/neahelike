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
  table => [check("role_ranks_pas_owner", sql`${table.rank} in ('recruteur', 'admin')`)],
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
