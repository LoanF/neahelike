CREATE TYPE "public"."faction_kind" AS ENUM('affinite', 'creature');--> statement-breakpoint
CREATE TABLE "factions" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "faction_kind" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"join_open" boolean DEFAULT true NOT NULL,
	"lead_open" boolean DEFAULT true NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"lore" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Comme les autres tables : accessible uniquement par connexion Postgres directe.
ALTER TABLE "factions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Affinités et créatures d'origine (leur lore reste dans le code), toutes ouvertes.
INSERT INTO "factions" ("id", "kind", "sort_order") VALUES
  ('fendeciels', 'affinite', 1),
  ('abyssiens', 'affinite', 2),
  ('toxotes', 'affinite', 3),
  ('ardents', 'affinite', 4),
  ('guerriers', 'affinite', 5),
  ('minotaures', 'creature', 1),
  ('colosses', 'creature', 2),
  ('centaures', 'creature', 3),
  ('sirenes', 'creature', 4),
  ('satyres', 'creature', 5)
ON CONFLICT ("id") DO NOTHING;
