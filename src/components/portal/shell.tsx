import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/(portail)/actions";
import { Badge, Logo } from "@/components/plaque";
import type { User } from "@/db/schema";
import { avatarUrl, displayName } from "@/lib/discord-cdn";
import { latestNotifications } from "@/lib/notifications";
import { NotificationBell } from "./notification-bell";
import { RANK_LABEL } from "./profile-card";
import { ShellNav } from "./shell-nav";
import styles from "./shell.module.css";

type ShellUser = Pick<User, "id" | "username" | "globalName" | "avatar" | "rank">;

/** Cadre des pages du portail : barre latérale (navigation, joueur) et zone de contenu. */
export async function PortalShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const notifications = await latestNotifications(user.id);
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <Logo size={40} />
          <span>Néa Hélikè</span>
        </Link>
        <ShellNav
          rank={user.rank}
          footer={
            <div className={styles.player}>
              <Image src={avatarUrl(user, 64)} alt="" width={40} height={40} className={styles.avatar} />
              <div className={styles.playerNames}>
                <span className={styles.playerName}>{displayName(user)}</span>
                {user.rank === "joueur" ? <span className={styles.playerHandle}>@{user.username}</span> : <Badge tone="gold">{RANK_LABEL[user.rank]}</Badge>}
              </div>
              <form action={logout}>
                <button type="submit" className={styles.logout} aria-label="Se déconnecter" title="Se déconnecter">
                  <LogOut size={18} aria-hidden="true" />
                </button>
              </form>
            </div>
          }
        />
      </aside>
      <div className={styles.content}>
        <div className={styles.topbar}>
          <NotificationBell initial={notifications} />
        </div>
        {children}
      </div>
    </div>
  );
}

/** En-tête de page du portail : surtitre, titre, texte et actions à droite. */
export function PortalHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className={styles.pageHead}>
      <div>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1 className={styles.pageTitle}>{title}</h1>
        {children && <p className={styles.pageText}>{children}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </header>
  );
}
