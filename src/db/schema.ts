import { boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const rank = pgEnum("rank", ["joueur", "recruteur", "staff"]);
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
 * `subjectId` = le joueur concerné, `actorId` = qui a agi (lui-même ou un membre du staff).
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
