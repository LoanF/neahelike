import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
