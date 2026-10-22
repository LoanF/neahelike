import { mkdir, writeFile } from "node:fs/promises";
import { encode } from "next-auth/jwt";
import postgres from "postgres";
import { CGU_VERSION } from "../../src/content/legal";
import { startFakeDiscord } from "./fake-discord";
import { BASE_URL, PLAYER, RECRUITER, RECRUITER_ROLE, stateFile } from "./users";

/**
 * Prépare les tests de bout en bout : comptes de test dans la base de test, faux Discord,
 * et cookies de session signés avec AUTH_SECRET (sans passer par l'OAuth Discord).
 */
export default async function globalSetup() {
  const url = process.env.E2E_DATABASE_URL;
  if (!url) throw new Error("E2E_DATABASE_URL manque : les tests de bout en bout tournent sur une base de test (voir README).");
  if (url.includes("supabase.com")) throw new Error("E2E_DATABASE_URL pointe vers Supabase : utilise une base locale, jamais la production.");
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manque.");

  const sql = postgres(url, { max: 1 });
  const ids = [PLAYER.id, RECRUITER.id];
  await sql`delete from users where id in ${sql(ids)}`;
  await sql`delete from reapply_locks where discord_id in ${sql(ids)}`;
  await sql`delete from rate_limits where key like ${"%:9000000000000000%"}`;
  for (const user of [PLAYER, RECRUITER]) {
    await sql`
      insert into users (id, username, global_name, rank, in_guild, cgu_accepted_at, cgu_version)
      values (${user.id}, ${user.username}, ${user.username}, ${user.rank}, true, now(), ${CGU_VERSION})`;
  }
  await sql`insert into role_ranks (role_id, rank) values (${RECRUITER_ROLE}, 'recruteur') on conflict (role_id) do update set rank = 'recruteur'`;
  await sql.end();

  const discord = await startFakeDiscord([
    { id: PLAYER.id, username: PLAYER.username, roles: [] },
    { id: RECRUITER.id, username: RECRUITER.username, roles: [RECRUITER_ROLE] },
  ]);

  await mkdir("tests/e2e/.auth", { recursive: true });
  const { hostname } = new URL(BASE_URL);
  for (const user of [PLAYER, RECRUITER]) {
    const token = await encode({ token: { sub: user.id, discordId: user.id, name: user.username }, secret, salt: "authjs.session-token" });
    const state = { cookies: [{ name: "authjs.session-token", value: token, domain: hostname, path: "/", expires: -1, httpOnly: true, secure: false, sameSite: "Lax" }], origins: [] };
    await writeFile(stateFile(user), JSON.stringify(state));
  }

  return async () => {
    discord.close();
    const cleanup = postgres(url, { max: 1 });
    await cleanup`delete from role_ranks where role_id = ${RECRUITER_ROLE}`;
    await cleanup.end();
  };
}
