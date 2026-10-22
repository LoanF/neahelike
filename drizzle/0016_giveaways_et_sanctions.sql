CREATE TYPE "public"."giveaway_status" AS ENUM('en_cours', 'termine', 'annule');--> statement-breakpoint
CREATE TYPE "public"."sanction_type" AS ENUM('avertissement', 'exclusion', 'expulsion', 'bannissement');--> statement-breakpoint
CREATE TABLE "bot_giveaway_entries" (
	"giveaway_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bot_giveaway_entries_giveaway_id_user_id_pk" PRIMARY KEY("giveaway_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "bot_giveaways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"message_id" text,
	"prize" text NOT NULL,
	"description" text,
	"winner_count" integer DEFAULT 1 NOT NULL,
	"required_role_id" text,
	"host_id" text NOT NULL,
	"status" "giveaway_status" DEFAULT 'en_cours' NOT NULL,
	"winner_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	CONSTRAINT "bot_giveaways_messageId_unique" UNIQUE("message_id"),
	CONSTRAINT "bot_giveaways_gagnants" CHECK ("bot_giveaways"."winner_count" between 1 and 20)
);
--> statement-breakpoint
CREATE TABLE "bot_sanctions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "bot_sanctions_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"moderator_id" text NOT NULL,
	"type" "sanction_type" NOT NULL,
	"reason" text NOT NULL,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by_id" text,
	"revoke_reason" text
);
--> statement-breakpoint
ALTER TABLE "bot_giveaway_entries" ADD CONSTRAINT "bot_giveaway_entries_giveaway_id_bot_giveaways_id_fk" FOREIGN KEY ("giveaway_id") REFERENCES "public"."bot_giveaways"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bot_giveaways_a_terminer_idx" ON "bot_giveaways" USING btree ("status","ends_at");--> statement-breakpoint
CREATE INDEX "bot_sanctions_casier_idx" ON "bot_sanctions" USING btree ("guild_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX "bot_sanctions_bans_a_lever_idx" ON "bot_sanctions" USING btree ("ends_at") WHERE "bot_sanctions"."type" = 'bannissement' and "bot_sanctions"."revoked_at" is null and "bot_sanctions"."ends_at" is not null;--> statement-breakpoint
-- Comme les autres tables : accessibles uniquement par connexion Postgres directe.
ALTER TABLE "bot_giveaways" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_giveaway_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_sanctions" ENABLE ROW LEVEL SECURITY;
