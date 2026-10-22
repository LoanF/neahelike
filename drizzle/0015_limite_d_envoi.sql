CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
-- Comme les autres tables : accessible uniquement par connexion Postgres directe.
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;
