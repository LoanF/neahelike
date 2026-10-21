import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { logEvent } from "@/lib/events";
import { syncMember } from "@/lib/members";

interface DiscordProfile {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  banner: string | null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Seul `identify` est demandé : l'appartenance au serveur et les rôles sont lus par le bot.
  providers: [Discord({ authorization: { params: { scope: "identify" } } })],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/connexion", error: "/connexion" },
  trustHost: true,
  callbacks: {
    async signIn({ profile }) {
      const discord = profile as unknown as DiscordProfile | undefined;
      if (!discord?.id) return false;

      const [row] = await db()
        .insert(schema.users)
        .values({
          id: discord.id,
          username: discord.username,
          globalName: discord.global_name,
          avatar: discord.avatar,
          banner: discord.banner,
          lastLoginAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.users.id,
          set: {
            username: discord.username,
            globalName: discord.global_name,
            avatar: discord.avatar,
            banner: discord.banner,
            lastLoginAt: new Date(),
          },
        })
        // xmax = 0 uniquement pour une ligne tout juste insérée.
        .returning({ created: sql<boolean>`(xmax = 0)` });

      if (row?.created) await logEvent({ type: "compte.cree", subjectId: discord.id });

      // Rang et présence sur le serveur relus à chaque connexion.
      await syncMember(discord.id);
      return true;
    },
    jwt({ token, profile }) {
      if (profile) token.discordId = (profile as unknown as DiscordProfile).id;
      return token;
    },
    session({ session, token }) {
      if (typeof token.discordId === "string") session.user.id = token.discordId;
      return session;
    },
  },
});
