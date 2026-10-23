import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { VerdictForm } from "@/components/equipe/verdict-form";
import { Badge, DotsRow, Plaque } from "@/components/plaque";
import { formatDate } from "@/components/portal/application-status";
import { PortalHeader } from "@/components/portal/shell";
import type { StepValues } from "@/db/schema";
import { takeoverNames } from "@/lib/businesses";
import { avatarUrl, displayName } from "@/lib/discord-cdn";
import { hasRank, requireUser } from "@/lib/session";
import { wipeBoard, wipeCandidates, wipeCountLabel } from "@/lib/wipes";
import styles from "../admin.module.css";
import { decideWipeAction } from "./actions";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "Wipes" };

type Player = { id: string; username: string; globalName: string | null; avatar: string | null };

const text = (values: StepValues | null | undefined, key: string) => (typeof values?.[key] === "string" ? (values[key] as string) : "");

function PlayerLink({ player }: { player: Player }) {
  return (
    <Link href={`/equipe/joueurs/${player.id}`} className={styles.person}>
      <Image unoptimized src={avatarUrl(player, 64)} alt="" width={32} height={32} className={styles.avatar} />
      <span>
        <span className={styles.personName}>{displayName(player)}</span>
        <span className={styles.personId}>{player.id}</span>
      </span>
    </Link>
  );
}

function Character({ title, rp, background, names }: { title: string; rp: StepValues | null; background?: StepValues | null; names: Record<string, string> }) {
  const url = text(background, "url");
  return (
    <div className={styles.compareCol}>
      <h4>{title}</h4>
      <strong>{[text(rp, "firstName"), text(rp, "lastName")].filter(Boolean).join(" ") || "—"}</strong>
      <span>{text(rp, "age") ? `${text(rp, "age")} ans` : "Âge non renseigné"}</span>
      <span>Affinité : {names[text(rp, "affinity")] ?? "aucune"}</span>
      <span>Créature : {names[text(rp, "creature")] ?? "humain"}</span>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className={styles.textButton}>
          Background <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

/** Onglet Wipe (admins et owners) : demandes à valider, invitations, demandes en cours et décisions récentes. */
export default async function WipesPage() {
  const viewer = await requireUser({ rank: "admin" });
  const [{ pending, open, decided }, candidates, names] = await Promise.all([wipeBoard(), wipeCandidates(), takeoverNames()]);

  return (
    <>
      <PortalHeader eyebrow="Administration" title="Wipes de personnage">
        Après accord sur un ticket Discord, le joueur remplit un nouveau personnage (fiche et background, sans le HRP). Une fois validé ici, il remplace l&apos;ancien. Les wipes
        n&apos;apparaissent pas sur la fiche du joueur.
      </PortalHeader>
      <div className={styles.page}>
        <Plaque className={styles.panel}>
          <DotsRow className={styles.dots} />
          <h2 className={styles.title}>À valider ({pending.length})</h2>
          {pending.length === 0 && <p className={styles.text}>Aucune demande à valider.</p>}
          {pending.map(({ wipe, player, previous, wipes }) => (
            <section key={wipe.id} className={styles.request} aria-label={`Wipe de ${displayName(player)}`}>
              <div className={styles.toolbar}>
                <PlayerLink player={player} />
                <Badge tone={wipes > 0 ? "gold" : "default"}>{wipeCountLabel(wipes)} déjà validé{wipes > 1 ? "s" : ""}</Badge>
                <span className={styles.personId}>Envoyée le {formatDate(wipe.submittedAt ?? wipe.createdAt)}</span>
              </div>
              <div className={styles.compare}>
                <Character title="Personnage actuel" rp={previous} names={names} />
                <Character title="Nouveau personnage" rp={wipe.rp} background={wipe.background} names={names} />
              </div>
              {player.id === viewer.id && !hasRank(viewer, "owner") ? (
                <p className={styles.text}>Ta propre demande : un autre admin doit la valider.</p>
              ) : (
                <VerdictForm action={decideWipeAction} id={wipe.id} acceptLabel="Valider le wipe" refuseLabel="Refuser" hint="Facultatif pour valider, obligatoire pour refuser. Le joueur le reçoit en privé." />
              )}
            </section>
          ))}
        </Plaque>

        <Plaque className={styles.panel}>
          <h2 className={styles.title}>Inviter un joueur</h2>
          <p className={styles.text}>Pour un wipe accepté sur un ticket Discord : le joueur reçoit un message privé avec le lien pour remplir son nouveau personnage.</p>
          <InviteForm players={candidates.map(player => ({ id: player.id, name: displayName(player) }))} />
        </Plaque>

        <Plaque className={styles.panel}>
          <h2 className={styles.title}>En cours de saisie ({open.length})</h2>
          {open.length === 0 ? (
            <p className={styles.text}>Personne ne remplit de nouveau personnage en ce moment.</p>
          ) : (
            <ul className={styles.rows}>
              {open.map(({ wipe, player, wipes }) => (
                <li key={wipe.id} className={styles.row}>
                  <PlayerLink player={player} />
                  <Badge tone={wipes > 0 ? "gold" : "default"}>{wipeCountLabel(wipes)}</Badge>
                  <Badge tone="default">{wipe.invitedById ? `Invité le ${formatDate(wipe.createdAt)}` : `Commencée le ${formatDate(wipe.createdAt)}`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Plaque>

        {decided.length > 0 && (
          <Plaque className={styles.panel}>
            <h2 className={styles.title}>Dernières décisions</h2>
            <ul className={styles.rows}>
              {decided.map(({ wipe, player, wipes }) => (
                <li key={wipe.id} className={styles.row}>
                  <PlayerLink player={player} />
                  <Badge tone={wipes > 0 ? "gold" : "default"}>{wipeCountLabel(wipes)}</Badge>
                  <Badge tone={wipe.status === "acceptee" ? "success" : "danger"}>
                    {wipe.status === "acceptee" ? "Validé" : "Refusé"} le {formatDate(wipe.decidedAt ?? wipe.createdAt)}
                  </Badge>
                </li>
              ))}
            </ul>
          </Plaque>
        )}
      </div>
    </>
  );
}
