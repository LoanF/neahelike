-- Les tables ne sont lues que par le serveur du site (connexion Postgres directe).
-- RLS activé sans politique : l'API publique de Supabase (clé anon) n'y a aucun accès.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
