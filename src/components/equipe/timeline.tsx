import { Ban, BadgeCheck, Check, Eye, FilePen, FileText, Link2, LogIn, MessageSquare, ScrollText, Shield, Trash2, UserMinus, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { cx } from "@/components/plaque";
import { criterionLabel } from "@/content/equipe";
import { STEPS } from "@/lib/application";
import { avatarUrl } from "@/lib/discord-cdn";
import type { TimelineEntry } from "@/lib/team";
import styles from "./timeline.module.css";

type Tone = "default" | "gold" | "success" | "danger";

const RANK: Record<string, string> = { joueur: "Joueur", recruteur: "Recruteur", admin: "Admin", owner: "Owner" };
const stepLabel = (id: unknown) => STEPS.find(step => step.id === id)?.label ?? String(id);
const list = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);

function describe(entry: TimelineEntry): { icon: LucideIcon; tone: Tone; text: string; detail?: string } {
  const data = entry.data as Record<string, unknown>;
  const who = entry.actorName ?? "Un membre de l'équipe";
  switch (entry.type) {
    case "compte.cree":
      return { icon: Link2, tone: "gold", text: "A lié son compte Discord au portail" };
    case "compte.cgu":
      return { icon: Check, tone: "default", text: "A accepté les CGU" };
    case "compte.connexion":
      return { icon: LogIn, tone: "default", text: "S'est connecté" };
    case "compte.supprime":
      return { icon: Trash2, tone: "danger", text: "A supprimé son compte" };
    case "discord.rejoint":
      return { icon: UserPlus, tone: "default", text: "A rejoint le Discord" };
    case "discord.quitte":
      return { icon: UserMinus, tone: "danger", text: "A quitté le Discord" };
    case "rang.change":
      return { icon: Shield, tone: "gold", text: `Rang : ${RANK[String(data.avant)] ?? data.avant} → ${RANK[String(data.apres)] ?? data.apres}` };
    case "candidature.commencee":
      return { icon: ScrollText, tone: "default", text: "A commencé sa candidature" };
    case "candidature.etape":
      return { icon: Check, tone: "default", text: `A rempli l'étape « ${stepLabel(data.etape)} »` };
    case "candidature.envoyee":
      return { icon: FileText, tone: "gold", text: data.renvoi ? "A renvoyé sa candidature corrigée" : "A envoyé sa candidature" };
    case "candidature.vue":
      return { icon: Eye, tone: "default", text: `${who} a ouvert la candidature` };
    case "candidature.validee":
      return { icon: BadgeCheck, tone: "success", text: `${who} a validé la candidature écrite`, detail: "Entretien vocal à passer." };
    case "candidature.modification":
      return {
        icon: FilePen,
        tone: "danger",
        text: `${who} a demandé une modification : ${list(data.etapes).map(stepLabel).join(", ")}`,
        detail: typeof data.commentaire === "string" ? data.commentaire : undefined,
      };
    case "candidature.refusee":
      return {
        icon: Ban,
        tone: "danger",
        text: `${who} a refusé la candidature`,
        detail: [list(data.criteres).map(criterionLabel).join(" · "), typeof data.commentaire === "string" ? data.commentaire : ""].filter(Boolean).join("\n"),
      };
    case "entretien.valide":
      return { icon: BadgeCheck, tone: "success", text: `${who} a validé l'entretien : joueur whitelisté` };
    case "candidature.supprimee":
      return { icon: Trash2, tone: "danger", text: `${who} a effacé la candidature` };
    case "note.ajoutee":
      return { icon: MessageSquare, tone: "default", text: `${who} a ajouté une note${data.visibilite === "admin" ? " (admins uniquement)" : ""}` };
    default:
      return { icon: Check, tone: "default", text: entry.type };
  }
}

const TEAM_EVENTS = new Set(["candidature.vue", "candidature.validee", "candidature.modification", "candidature.refusee", "entretien.valide", "candidature.supprimee", "note.ajoutee"]);

const when = (date: Date) =>
  date.toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

/** Chronologie d'un joueur : ses étapes et chaque action de l'équipe, avec qui et quand. */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <p className={styles.empty}>Aucun événement.</p>;
  return (
    <ol className={styles.timeline}>
      {entries.map(entry => {
        const { icon: Icon, tone, text, detail } = describe(entry);
        const team = TEAM_EVENTS.has(entry.type);
        return (
          <li key={entry.id} className={cx(styles.item, styles[tone])}>
            <span className={styles.dot} aria-hidden="true">
              <Icon size={14} />
            </span>
            <div className={styles.body}>
              <span className={styles.text}>
                {team && entry.actorId && <Image src={avatarUrl({ id: entry.actorId, avatar: entry.actorAvatar }, 32)} alt="" width={18} height={18} className={styles.actor} />}
                {text}
              </span>
              {detail && <p className={styles.detail}>{detail}</p>}
              <time className={styles.time} dateTime={entry.createdAt.toISOString()}>
                {when(entry.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
