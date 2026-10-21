CREATE TABLE "refusal_criteria" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Comme les autres tables : accessible uniquement par connexion Postgres directe.
ALTER TABLE "refusal_criteria" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Critères d'origine (mêmes identifiants que dans les refus déjà enregistrés).
INSERT INTO "refusal_criteria" ("id", "label", "sort_order") VALUES
  ('background', 'Background trop court ou peu travaillé', 1),
  ('coherence', 'Personnage incohérent', 2),
  ('lore', 'Non-respect du lore', 3),
  ('redaction', 'Orthographe et rédaction', 4),
  ('experience', 'Expérience RP insuffisante', 5),
  ('hrp', 'Informations HRP incomplètes ou incohérentes', 6),
  ('document', 'Document inaccessible', 7),
  ('dossier', 'Dossier de reprise insuffisant', 8),
  ('entretien', 'Entretien vocal non concluant', 9),
  ('autre', 'Autre (voir le commentaire)', 10)
ON CONFLICT ("id") DO NOTHING;
