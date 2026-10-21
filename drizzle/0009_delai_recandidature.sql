CREATE TABLE "reapply_locks" (
	"discord_id" text PRIMARY KEY NOT NULL,
	"until" timestamp with time zone NOT NULL
);
--> statement-breakpoint
-- Comme les autres tables : accessible uniquement par connexion Postgres directe.
ALTER TABLE "reapply_locks" ENABLE ROW LEVEL SECURITY;
