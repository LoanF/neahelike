CREATE TYPE "public"."note_visibility" AS ENUM('equipe', 'staff');--> statement-breakpoint
CREATE TABLE "profile_views" (
	"subject_id" text NOT NULL,
	"viewer_id" text NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_views_subject_id_viewer_id_pk" PRIMARY KEY("subject_id","viewer_id")
);
--> statement-breakpoint
CREATE TABLE "staff_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" text NOT NULL,
	"author_id" text,
	"visibility" "note_visibility" DEFAULT 'equipe' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "reviewer_id" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "changes_steps" text[];--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "changes_comment" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "refusal_criteria" text[];--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "refusal_comment" text;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_subject_id_users_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_notes" ADD CONSTRAINT "staff_notes_subject_id_users_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_notes" ADD CONSTRAINT "staff_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_notes_subject_idx" ON "staff_notes" USING btree ("subject_id","created_at");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Comme les autres tables : accessibles uniquement par connexion Postgres directe.
ALTER TABLE "staff_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profile_views" ENABLE ROW LEVEL SECURITY;
