-- « staff » devient « admin », et le rang « owner » est ajouté au-dessus.
ALTER TYPE "public"."rank" RENAME VALUE 'staff' TO 'admin';--> statement-breakpoint
ALTER TYPE "public"."rank" ADD VALUE IF NOT EXISTS 'owner';--> statement-breakpoint
ALTER TYPE "public"."note_visibility" RENAME VALUE 'staff' TO 'admin';--> statement-breakpoint
-- Le journal garde les anciens libellés dans ses données : on les aligne.
UPDATE "events" SET "data" = jsonb_set("data", '{visibilite}', '"admin"') WHERE "type" = 'note.ajoutee' AND "data"->>'visibilite' = 'staff';--> statement-breakpoint
UPDATE "events" SET "data" = jsonb_set("data", '{avant}', '"admin"') WHERE "type" = 'rang.change' AND "data"->>'avant' = 'staff';--> statement-breakpoint
UPDATE "events" SET "data" = jsonb_set("data", '{apres}', '"admin"') WHERE "type" = 'rang.change' AND "data"->>'apres' = 'staff';
