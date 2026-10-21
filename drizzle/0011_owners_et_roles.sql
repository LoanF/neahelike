CREATE TABLE "role_ranks" (
	"role_id" text PRIMARY KEY NOT NULL,
	"rank" "rank" NOT NULL,
	"updated_by_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_ranks_pas_owner" CHECK ("role_ranks"."rank" in ('recruteur', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "site_owners" (
	"discord_id" text PRIMARY KEY NOT NULL,
	"added_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Comme les autres tables : accessibles uniquement par connexion Postgres directe.
ALTER TABLE "site_owners" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "role_ranks" ENABLE ROW LEVEL SECURITY;
