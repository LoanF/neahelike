import type { Metadata } from "next";
import { inArray } from "drizzle-orm";
import { DotsRow, Plaque } from "@/components/plaque";
import { PortalHeader } from "@/components/portal/shell";
import { PERMANENT_OWNERS } from "@/content/owners";
import { db, schema } from "@/db";
import type { GuildRole } from "@/lib/discord";
import { getGuildRoles, getUser } from "@/lib/discord";
import { displayName } from "@/lib/discord-cdn";
import { env } from "@/lib/env";
import { isPermanentOwner, ownerIds, roleRanks } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import styles from "../admin.module.css";
import type { OwnerRow } from "./owners";
import { Owners } from "./owners";
import type { RoleRow } from "./roles-form";
import { RolesForm } from "./roles-form";

export const metadata: Metadata = { title: "Rôles et permissions" };

const hex = (color: number) => (color ? `#${color.toString(16).padStart(6, "0")}` : null);

export default async function RolesPage() {
  const viewer = await requireUser({ rank: "owner" });
  const [{ ranks, source }, ids] = await Promise.all([roleRanks(), ownerIds()]);

  let guildRoles: GuildRole[] = [];
  let discordError = false;
  try {
    guildRoles = await getGuildRoles();
  } catch (error) {
    console.error("Lecture des rôles Discord impossible", error);
    discordError = true;
  }

  // @everyone (même ID que le serveur) et les rôles gérés par Discord (bots, boost) ne donnent jamais de droits.
  const roles: RoleRow[] = guildRoles
    .filter(role => role.id !== env().DISCORD_GUILD_ID && !role.managed)
    .sort((a, b) => b.position - a.position)
    .map(role => ({ id: role.id, name: role.name, color: hex(role.color), rank: ranks.get(role.id) ?? "joueur" }));

  // Noms des owners : depuis les comptes du site, sinon depuis Discord.
  const known = await db().select().from(schema.users).where(inArray(schema.users.id, ids));
  const owners: OwnerRow[] = await Promise.all(
    ids.map(async id => {
      const user = known.find(item => item.id === id);
      const fallback = user ? null : await getUser(id).catch(() => null);
      const label = PERMANENT_OWNERS.find(owner => owner.id === id)?.label;
      return {
        id,
        name: user ? displayName(user) : (fallback?.global_name ?? fallback?.username ?? label ?? id),
        avatar: user?.avatar ?? fallback?.avatar ?? null,
        permanent: isPermanentOwner(id),
        self: id === viewer.id,
      };
    }),
  );

  return (
    <>
      <PortalHeader eyebrow="Administration" title="Rôles et permissions">
        Choisis ce que chaque rôle Discord donne sur le site. Les owners ont toujours tous les droits, quels que soient leurs rôles.
      </PortalHeader>
      <div className={styles.page}>
        <Plaque className={styles.panel}>
          <DotsRow className={styles.dots} />
          <h2 className={styles.title}>Rôles Discord</h2>
          <p className={styles.text}>
            <strong>Joueur</strong> : le portail et la candidature. <strong>Recruteur</strong> : lire les candidatures et décider. <strong>Admin</strong> : tout ce que fait un
            recruteur, plus l&apos;administration. Un membre avec plusieurs rôles prend le plus élevé.
          </p>
          {source === "vercel" && (
            <p className={styles.info}>Ces réglages viennent encore de la configuration Vercel. Ils seront enregistrés sur le site au premier enregistrement.</p>
          )}
          {discordError ? (
            <p className={styles.error} role="alert">
              Impossible de lire les rôles du serveur Discord pour le moment. Les réglages enregistrés continuent de s&apos;appliquer.
            </p>
          ) : (
            <RolesForm roles={roles} />
          )}
        </Plaque>

        <Plaque className={styles.panel}>
          <h2 className={styles.title}>Owners</h2>
          <p className={styles.text}>
            Les owners gèrent cette page et ont tous les droits du site. Les owners permanents sont définis dans le code : ils le restent même si la base de données est
            réinitialisée.
          </p>
          <Owners owners={owners} />
        </Plaque>
      </div>
    </>
  );
}
