CREATE TYPE "public"."ticket_status" AS ENUM('ouvert', 'ferme');--> statement-breakpoint
CREATE TABLE "bot_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "bot_tickets_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"guild_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"category_id" text NOT NULL,
	"category_label" text NOT NULL,
	"opener_id" text NOT NULL,
	"claimed_by_id" text,
	"status" "ticket_status" DEFAULT 'ouvert' NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"close_reason" text,
	"closed_by_id" text,
	"transcript" text,
	"rating" integer,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "bot_tickets_channelId_unique" UNIQUE("channel_id"),
	CONSTRAINT "bot_tickets_note" CHECK ("bot_tickets"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bot_tickets_un_ouvert_par_categorie" ON "bot_tickets" USING btree ("guild_id","opener_id","category_id") WHERE "bot_tickets"."status" = 'ouvert';--> statement-breakpoint
CREATE INDEX "bot_tickets_inactifs_idx" ON "bot_tickets" USING btree ("status","last_activity_at");