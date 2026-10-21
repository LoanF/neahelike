import { Ban, BadgeCheck, Briefcase, Check, Crown, Eye, FilePen, FileText, KeyRound, Link2, ListX, LogIn, MessageSquare, ScrollText, Shield, Sparkles, Trash2, UserMinus, UserPlus } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { cx } from "@/components/plaque";
import { STEPS } from "@/lib/application";
import { avatarUrl } from "@/lib/discord-cdn";
import type { TimelineEntry } from "@/lib/team";
import styles from "./timeline.module.css";

type Tone = "default" | "gold" | "success" | "danger";

const RANK: Record<string, string> = { joueur: "Joueur", recruteur: "Recruteur", admin: "Admin", owner: "Owner" };
const stepLabel = (id: unknown) => STEPS.find(step => step.id === id)?.label ?? String(id);
const list = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);

function describe(entry: TimelineEntry, criteria: Record<string, string>): { icon: LucideIcon; tone: Tone; text: string; detail?: string } {
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
        detail: [list(data.criteres).map(id => criteria[id] ?? id).join(" · "), typeof data.commentaire === "string" ? data.commentaire : ""].filter(Boolean).join("\n"),
      };
    case "entretien.valide":
      return { icon: BadgeCheck, tone: "success", text: `${who} a validé l'entretien : joueur whitelisté` };
    case "candidature.supprimee":
      return { icon: Trash2, tone: "danger", text: `${who} a effacé la candidature` };
    case "note.ajoutee":
      return { icon: MessageSquare, tone: "default", text: `${who} a ajouté une note${data.visibilite === "admin" ? " (admins uniquement)" : ""}` };
    case "role.rang":
      return { icon: KeyRound, tone: "gold", text: `${who} : le rôle « ${data.nom} » donne maintenant le rang ${RANK[String(data.apres)] ?? data.apres}` };
    case "owner.ajoute":
      return { icon: Crown, tone: "gold", text: `${who} a ajouté un owner (${data.owner})` };
    case "owner.retire":
      return { icon: Crown, tone: "danger", text: `${who} a retiré un owner (${data.owner})` };
    case "faction.ajoutee":
      return { icon: Sparkles, tone: "gold", text: `${who} a ajouté ${data.type === "creature" ? "la créature" : "l'affinité"} « ${data.nom} »` };
    case "faction.modifiee":
      return { icon: Sparkles, tone: "default", text: `${who} a modifié « ${data.nom} »`, detail: changeDetail(data) };
    case "entreprise.ajoutee":
      return { icon: Briefcase, tone: "gold", text: `${who} a ajouté l'entreprise « ${data.nom} »` };
    case "entreprise.modifiee":
      return { icon: Briefcase, tone: "default", text: `${who} a modifié l'entreprise « ${data.nom} »`, detail: changeDetail(data) };
    case "critere.ajoute":
      return { icon: ListX, tone: "gold", text: `${who} a ajouté le critère de refus « ${data.libelle} »` };
    case "critere.modifie":
      return { icon: ListX, tone: "default", text: `${who} a modifié le critère « ${data.libelle} »`, detail: changeDetail(data) };
    default:
      return { icon: Check, tone: "default", text: entry.type };
  }
}

/** Détail lisible d'une modification d'administration (ouverture, lead, archivage, ordre). */
function changeDetail(data: Record<string, unknown>) {
  const parts: string[] = [];
  if (typeof data.joinOpen === "boolean") parts.push(data.joinOpen ? "Places ouvertes" : "Places closes");
  if (typeof data.leadOpen === "boolean") parts.push(data.leadOpen ? "Lead disponible" : "Lead repris");
  if (typeof data.open === "boolean") parts.push(data.open ? "Disponible" : "Déjà reprise");
  if (typeof data.archived === "boolean") parts.push(data.archived ? "Archivée" : "Restaurée");
  if (typeof data.actif === "boolean") parts.push(data.actif ? "Proposé" : "Désactivé");
  if (typeof data.ordre === "number") parts.push(`Position ${data.ordre}`);
  if (data.lore) parts.push("Lore modifié");
  return parts.join(" · ") || undefined;
}

const TEAM_EVENTS = new Set([
  "candidature.vue",
  "candidature.validee",
  "candidature.modification",
  "candidature.refusee",
  "entretien.valide",
  "candidature.supprimee",
  "note.ajoutee",
  "role.rang",
  "owner.ajoute",
  "owner.retire",
  "faction.ajoutee",
  "faction.modifiee",
  "entreprise.ajoutee",
  "entreprise.modifiee",
  "critere.ajoute",
  "critere.modifie",
]);

const when = (date: Date) =>
  date.toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

/** Chronologie d'un joueur : ses étapes et chaque action de l'équipe, avec qui et quand. */
/**
 * `criteria` : libellés des critères de refus (lib/criteria.ts).
 * `showSubject` : journal global, chaque ligne indique le joueur concerné avec un lien vers sa fiche.
 */
export function Timeline({ entries, criteria, showSubject = false }: { entries: TimelineEntry[]; criteria: Record<string, string>; showSubject?: boolean }) {
  if (entries.length === 0) return <p className={styles.empty}>Aucun événement.</p>;
  return (
    <ol className={styles.timeline}>
      {entries.map(entry => {
        const { icon: Icon, tone, text, detail } = describe(entry, criteria);
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
              {showSubject && entry.subjectId && (
                <Link href={`/equipe/joueurs/${entry.subjectId}`} className={styles.subject}>
                  {entry.subjectName ?? entry.subjectId}
                </Link>
              )}
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
