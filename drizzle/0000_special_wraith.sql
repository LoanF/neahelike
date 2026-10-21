CREATE TYPE "public"."rank" AS ENUM('joueur', 'recruteur', 'staff');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" text,
	"actor_id" text,
	"type" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"global_name" text,
	"avatar" text,
	"banner" text,
	"rank" "rank" DEFAULT 'joueur' NOT NULL,
	"in_guild" boolean DEFAULT false NOT NULL,
	"roles_synced_at" timestamp with time zone,
	"cgu_accepted_at" timestamp with time zone,
	"cgu_version" text,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_subject_id_users_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_subject_idx" ON "events" USING btree ("subject_id","created_at");--> statement-breakpoint
CREATE INDEX "events_created_idx" ON "events" USING btree ("created_at");