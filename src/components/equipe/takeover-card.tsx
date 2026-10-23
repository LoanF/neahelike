import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/plaque";
import type { TakeoverDossier } from "@/db/schema";
import { decideDossierAction } from "@/app/(portail)/equipe/dossiers/actions";
import { formatDate } from "@/components/portal/application-status";
import { dossierTargetLabel } from "@/lib/application";
import { avatarUrl, displayName } from "@/lib/discord-cdn";
import { VerdictForm } from "./verdict-form";
import styles from "./takeover-card.module.css";

const STATUS: Record<TakeoverDossier["status"], { label: string; tone: "default" | "gold" | "success" | "danger" }> = {
  brouillon: { label: "En cours de saisie", tone: "default" },
  envoye: { label: "À lire", tone: "gold" },
  accepte: { label: "Accepté", tone: "success" },
  refuse: { label: "Refusé", tone: "danger" },
};

interface TakeoverCardProps {
  dossier: TakeoverDossier;
  names: Record<string, string>;
  /** Joueur affiché en tête (liste de l'équipe), absent sur sa propre fiche. */
  player?: { id: string; username: string; globalName: string | null; avatar: string | null };
  /** Le lecteur peut accepter ou refuser (pas son propre dossier, sauf owner). */
  canDecide: boolean;
}

/** Un dossier de reprise déposé à part : cible, lien, et la décision de l'équipe. */
export function TakeoverCard({ dossier, names, player, canDecide }: TakeoverCardProps) {
  const url = typeof dossier.content?.url === "string" ? dossier.content.url : null;
  const status = STATUS[dossier.status];
  return (
    <article className={styles.card}>
      <header className={styles.head}>
        {player && (
          <Link href={`/equipe/joueurs/${player.id}`} className={styles.person}>
            <Image src={avatarUrl(player, 64)} alt="" width={32} height={32} className={styles.avatar} />
            <span>{displayName(player)}</span>
          </Link>
        )}
        <strong className={styles.target}>{dossierTargetLabel(dossier.content, names) ?? "Reprise"}</strong>
        <Badge tone={status.tone}>{status.label}</Badge>
      </header>
      <p className={styles.meta}>
        {dossier.submittedAt ? `Envoyé le ${formatDate(dossier.submittedAt)}` : "Pas encore envoyé"}
        {dossier.decidedAt && ` · décidé le ${formatDate(dossier.decidedAt)}`}
      </p>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className={styles.link}>
          Ouvrir le dossier <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
      {dossier.comment && <p className={styles.quote}>« {dossier.comment} »</p>}
      {canDecide && (
        <VerdictForm
          action={decideDossierAction}
          id={dossier.id}
          active={dossier.status === "envoye"}
          acceptLabel="Accepter le dossier"
          refuseLabel="Refuser"
          hint="Facultatif pour accepter, obligatoire pour refuser. Le joueur le reçoit en privé."
        />
      )}
    </article>
  );
}
