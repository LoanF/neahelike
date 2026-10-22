CREATE TABLE "blacklist" (
	"discord_id" text PRIMARY KEY NOT NULL,
	"reason" text,
	"created_by_id" text NOT NULL,
	"source" text DEFAULT 'site' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "whitelist_revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "whitelist_revoked_by_id" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "whitelist_revoke_reason" text;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_whitelist_revoked_by_id_users_id_fk" FOREIGN KEY ("whitelist_revoked_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Comme les autres tables : accessible uniquement par connexion Postgres directe.
ALTER TABLE "blacklist" ENABLE ROW LEVEL SECURITY;
