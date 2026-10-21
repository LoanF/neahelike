CREATE TABLE "bot_command_permissions" (
	"guild_id" text NOT NULL,
	"command" text NOT NULL,
	"level_id" uuid,
	CONSTRAINT "bot_command_permissions_guild_id_command_pk" PRIMARY KEY("guild_id","command")
);
--> statement-breakpoint
CREATE TABLE "bot_guild_config" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"prefix" text DEFAULT '+' NOT NULL,
	"embed_color" text DEFAULT '#d1a64a' NOT NULL,
	"embed_color_dark" text DEFAULT '#1a150f' NOT NULL,
	"embed_color_light" text DEFAULT '#f1ece2' NOT NULL,
	"nickname" text,
	"bio" text,
	"avatar_url" text,
	"banner_url" text,
	"presence_status" text DEFAULT 'online' NOT NULL,
	"activity_type" text DEFAULT 'personnalise' NOT NULL,
	"activity_text" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_messages" (
	"guild_id" text NOT NULL,
	"key" text NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bot_messages_guild_id_key_pk" PRIMARY KEY("guild_id","key")
);
--> statement-breakpoint
CREATE TABLE "bot_modules" (
	"guild_id" text NOT NULL,
	"module" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"level_id" uuid,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bot_modules_guild_id_module_pk" PRIMARY KEY("guild_id","module")
);
--> statement-breakpoint
CREATE TABLE "bot_permission_level_roles" (
	"level_id" uuid NOT NULL,
	"role_id" text NOT NULL,
	CONSTRAINT "bot_permission_level_roles_level_id_role_id_pk" PRIMARY KEY("level_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "bot_permission_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" text NOT NULL,
	"name" text NOT NULL,
	"weight" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bot_permission_levels_guildId_name_unique" UNIQUE("guild_id","name"),
	CONSTRAINT "bot_permission_levels_guildId_weight_unique" UNIQUE("guild_id","weight")
);
--> statement-breakpoint
ALTER TABLE "bot_command_permissions" ADD CONSTRAINT "bot_command_permissions_level_id_bot_permission_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."bot_permission_levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_modules" ADD CONSTRAINT "bot_modules_level_id_bot_permission_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."bot_permission_levels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_permission_level_roles" ADD CONSTRAINT "bot_permission_level_roles_level_id_bot_permission_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."bot_permission_levels"("id") ON DELETE cascade ON UPDATE no action;