import { mkdir, writeFile } from "node:fs/promises";
import { encode } from "next-auth/jwt";
import postgres from "postgres";
import { CGU_VERSION } from "../../src/content/legal";
import { startFakeDiscord } from "./fake-discord";
import { ADMIN, ADMIN_ROLE, BASE_URL, BOT_BLACKLISTED, OWNER, PLAYER, RECRUITER, RECRUITER_ROLE, stateFile, USERS, WHITELISTED } from "./users";

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
  const ids = USERS.map(user => user.id);
  await sql`delete from users where id in ${sql(ids)}`;
  await sql`delete from reapply_locks where discord_id in ${sql(ids)}`;
  await sql`delete from blacklist where discord_id in ${sql(ids)}`;
  await sql`delete from site_owners where discord_id in ${sql(ids)}`;
  await sql`delete from rate_limits where key like ${"%:9000000000000000%"}`;
  for (const user of USERS) {
    await sql`
      insert into users (id, username, global_name, rank, in_guild, cgu_accepted_at, cgu_version)
      values (${user.id}, ${user.username}, ${user.username}, ${user.rank}, true, now(), ${CGU_VERSION})`;
  }
  await sql`insert into role_ranks (role_id, rank) values (${RECRUITER_ROLE}, 'recruteur') on conflict (role_id) do update set rank = 'recruteur'`;
  await sql`insert into role_ranks (role_id, rank) values (${ADMIN_ROLE}, 'admin') on conflict (role_id) do update set rank = 'admin'`;
  // Un joueur déjà whitelist (candidature validée) et un joueur blacklisté par le bot.
  await sql`
    insert into applications (user_id, status, hrp, rp, background, submitted_at, decided_at)
    values (${WHITELISTED.id}, 'whitelistee', ${sql.json({ age: "25", rpHours: "500", experience: "Joueur de test whitelist.", goodMic: true, wantsDossier: false })},
            ${sql.json({ firstName: "Ilios", lastName: "Phaedra", age: "28", origin: "Né au port de la cité.", affinity: "", creature: "" })},
            ${sql.json({ url: "https://docs.google.com/document/d/e2e-wl", shared: true })}, now(), now())`;
  await sql`insert into blacklist (discord_id, reason, created_by_id, source) values (${BOT_BLACKLISTED.id}, 'Triche en jeu (test)', ${ADMIN.id}, 'bot')`;
  // L'admin de test a lui aussi une candidature envoyée : il ne doit pas pouvoir en décider.
  await sql`
    insert into applications (user_id, status, hrp, rp, background, submitted_at)
    values (${ADMIN.id}, 'envoyee', ${sql.json({ age: "30", rpHours: "900", experience: "Admin de test.", goodMic: true, wantsDossier: false })},
            ${sql.json({ firstName: "Kleon", lastName: "Aristos", age: "35", origin: "Né au palais de la cité.", affinity: "", creature: "" })},
            ${sql.json({ url: "https://docs.google.com/document/d/e2e-admin", shared: true })}, now())`;
  // L'owner de test a aussi une candidature envoyée : lui peut en décider.
  await sql`insert into site_owners (discord_id) values (${OWNER.id})`;
  await sql`
    insert into applications (user_id, status, hrp, rp, background, submitted_at)
    values (${OWNER.id}, 'envoyee', ${sql.json({ age: "31", rpHours: "1200", experience: "Owner de test.", goodMic: true, wantsDossier: false })},
            ${sql.json({ firstName: "Theron", lastName: "Kallias", age: "40", origin: "Né au temple de la cité.", affinity: "", creature: "" })},
            ${sql.json({ url: "https://docs.google.com/document/d/e2e-owner", shared: true })}, now())`;
  await sql.end();

  const discord = await startFakeDiscord([
    { id: PLAYER.id, username: PLAYER.username, roles: [] },
    { id: RECRUITER.id, username: RECRUITER.username, roles: [RECRUITER_ROLE] },
    { id: ADMIN.id, username: ADMIN.username, roles: [ADMIN_ROLE] },
    { id: WHITELISTED.id, username: WHITELISTED.username, roles: [] },
    { id: BOT_BLACKLISTED.id, username: BOT_BLACKLISTED.username, roles: [] },
    { id: OWNER.id, username: OWNER.username, roles: [] },
  ]);

  await mkdir("tests/e2e/.auth", { recursive: true });
  const { hostname } = new URL(BASE_URL);
  for (const user of USERS) {
    const token = await encode({ token: { sub: user.id, discordId: user.id, name: user.username }, secret, salt: "authjs.session-token" });
    const state = { cookies: [{ name: "authjs.session-token", value: token, domain: hostname, path: "/", expires: -1, httpOnly: true, secure: false, sameSite: "Lax" }], origins: [] };
    await writeFile(stateFile(user), JSON.stringify(state));
  }

  return async () => {
    discord.close();
    const cleanup = postgres(url, { max: 1 });
    await cleanup`delete from role_ranks where role_id in ${cleanup([RECRUITER_ROLE, ADMIN_ROLE])}`;
    await cleanup`delete from site_owners where discord_id = ${OWNER.id}`;
    await cleanup.end();
  };
}
