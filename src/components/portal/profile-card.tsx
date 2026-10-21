import Image from "next/image";
import { Badge } from "@/components/plaque";
import type { User } from "@/db/schema";
import { avatarUrl, bannerUrl, displayName } from "@/lib/discord-cdn";
import styles from "./profile-card.module.css";

export const RANK_LABEL: Record<User["rank"], string> = {
  joueur: "Joueur",
  recruteur: "Recruteur",
  admin: "Admin",
  owner: "Owner",
};

type ProfileUser = Pick<User, "id" | "username" | "globalName" | "avatar" | "banner" | "rank">;

/** Carte de profil Discord : bannière, avatar, nom, rang, ID. */
export function ProfileCard({ user }: { user: ProfileUser }) {
  const banner = bannerUrl(user);
  return (
    <div className={styles.card}>
      <div className={styles.banner}>
        {banner && <Image src={banner} alt="" fill sizes="440px" className={styles.bannerImage} />}
      </div>
      <div className={styles.identity}>
        <Image src={avatarUrl(user, 128)} alt="" width={64} height={64} className={styles.avatar} />
        <div className={styles.names}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{displayName(user)}</span>
            <Badge>{RANK_LABEL[user.rank]}</Badge>
          </div>
          <span className={styles.username}>@{user.username}</span>
        </div>
      </div>
      <div className={styles.idRow}>
        <span>ID Discord</span>
        <span className={styles.id}>{user.id}</span>
      </div>
    </div>
  );
}
