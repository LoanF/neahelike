-- Tables du bot : lues et écrites par connexion Postgres directe (site et bot), jamais par l'API publique.
ALTER TABLE "bot_guild_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_permission_levels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_permission_level_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_modules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_command_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_messages" ENABLE ROW LEVEL SECURITY;
