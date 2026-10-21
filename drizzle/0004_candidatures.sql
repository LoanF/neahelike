CREATE TYPE "public"."application_status" AS ENUM('brouillon', 'envoyee', 'a_modifier', 'entretien', 'whitelistee', 'refusee');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"status" "application_status" DEFAULT 'brouillon' NOT NULL,
	"hrp" jsonb,
	"rp" jsonb,
	"background" jsonb,
	"dossier" jsonb,
	"submitted_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_user_idx" ON "applications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_user_open_idx" ON "applications" USING btree ("user_id") WHERE "applications"."status" not in ('whitelistee', 'refusee');--> statement-breakpoint
-- Comme les autres tables : accessible uniquement par connexion Postgres directe.
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;
