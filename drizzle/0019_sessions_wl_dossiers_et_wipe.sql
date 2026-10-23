CREATE TYPE "public"."takeover_status" AS ENUM('brouillon', 'envoye', 'accepte', 'refuse');--> statement-breakpoint
CREATE TYPE "public"."wipe_status" AS ENUM('ouverte', 'envoyee', 'acceptee', 'refusee');--> statement-breakpoint
CREATE TABLE "takeover_dossiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"application_id" uuid,
	"status" "takeover_status" DEFAULT 'brouillon' NOT NULL,
	"content" jsonb,
	"reviewer_id" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wipe_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"status" "wipe_status" DEFAULT 'ouverte' NOT NULL,
	"rp" jsonb,
	"background" jsonb,
	"invited_by_id" text,
	"reviewer_id" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "interview_slot_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "interview_slot_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "reapply_lifted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "takeover_dossiers" ADD CONSTRAINT "takeover_dossiers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeover_dossiers" ADD CONSTRAINT "takeover_dossiers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeover_dossiers" ADD CONSTRAINT "takeover_dossiers_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wipe_requests" ADD CONSTRAINT "wipe_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wipe_requests" ADD CONSTRAINT "wipe_requests_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wipe_requests" ADD CONSTRAINT "wipe_requests_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "takeover_dossiers_user_idx" ON "takeover_dossiers" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "takeover_dossiers_user_open_idx" ON "takeover_dossiers" USING btree ("user_id") WHERE "takeover_dossiers"."status" in ('brouillon', 'envoye');--> statement-breakpoint
CREATE INDEX "wipe_requests_user_idx" ON "wipe_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wipe_requests_user_open_idx" ON "wipe_requests" USING btree ("user_id") WHERE "wipe_requests"."status" in ('ouverte', 'envoyee');--> statement-breakpoint
-- Comme les autres tables : accessible uniquement par connexion Postgres directe.
ALTER TABLE "takeover_dossiers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "wipe_requests" ENABLE ROW LEVEL SECURITY;
