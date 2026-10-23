import { ArrowLeft, FileStack } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Badge, DotsRow, Plaque } from "@/components/plaque";
import { formatDate } from "@/components/portal/application-status";
import { RANK_LABEL } from "@/components/portal/profile-card";
import { BADGE_LABEL, BADGE_TONE } from "@/components/equipe/badges";
import { ProfilePresence } from "@/components/equipe/live-presence";
import { Timeline } from "@/components/equipe/timeline";
import { db, schema } from "@/db";
import { dossierTargetLabel, isStepComplete, visibleSteps, wantsDossier } from "@/lib/application";
import { getLatestApplication } from "@/lib/applications";
import { getBlacklistEntry } from "@/lib/blacklist";
import { takeoverNames } from "@/lib/businesses";
import { criteriaLabels, getCriteria } from "@/lib/criteria";
import { avatarUrl, bannerUrl, displayName } from "@/lib/discord-cdn";
import { canActOn, markViewed } from "@/lib/review";
import { hasRank, requireUser } from "@/lib/session";
import { canDeleteNote, notesFor, teamBadge, timeline } from "@/lib/team";
import { ApplicationRecap } from "../../../portail/candidature/recap";
import { DecisionPanel } from "./decision-panel";
import { DeleteAccount } from "./delete-account";
import styles from "./fiche.module.css";
import type { NoteView } from "./notes";
import { Notes } from "./notes";
import { Sanctions } from "./sanctions";

export const metadata: Metadata = { title: "Fiche joueur" };

const noteDate = (date: Date) => date.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export default async function FichePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const viewer = await requireUser({ rank: "recruteur" });
  const [[player], application] = await Promise.all([db().select().from(schema.users).where(eq(schema.users.id, id)), getLatestApplication(id)]);
  if (!player) notFound();

  // Ouvrir sa propre fiche ne compte pas comme une lecture par l'équipe.
  if (application && player.id !== viewer.id) await markViewed(application, viewer);
  const isAdmin = hasRank(viewer, "admin");

  const [events, notes, names, criteria, activeCriteria, blacklisted] = await Promise.all([
    timeline(player.id),
    notesFor(player.id, viewer),
    takeoverNames(),
    criteriaLabels(),
    getCriteria(),
    getBlacklistEntry(player.id),
  ]);
  // Un recruteur ne doit pas deviner l'existence d'une note réservée aux admins.
  const visibleEvents = isAdmin ? events : events.filter(event => !(event.type === "note.ajoutee" && (event.data as { visibilite?: string }).visibilite === "admin"));
  const noteViews: NoteView[] = notes.map(note => ({
    id: note.id,
    content: note.content,
    visibility: note.visibility,
    date: noteDate(note.createdAt),
    authorId: note.authorId,
    authorName: note.authorName,
    authorAvatar: note.authorAvatar,
    canDelete: canDeleteNote(note, viewer) && (isAdmin || note.visibility === "equipe"),
  }));

  // Sanctions et suppression : seulement sur un rang inférieur, jamais sur un owner ; sur soi, owners seulement.
  const canSanction = isAdmin && !(await canActOn(player.id, viewer, { known: player }));
  const canDecide = player.id !== viewer.id || hasRank(viewer, "owner");
  const badge = teamBadge(application, !!blacklisted);
  const whitelisted = application?.status === "whitelistee" && !application.whitelistRevokedAt;
  const banner = bannerUrl(player, 960);
  const rp = application?.rp;
  const rpName = [rp?.firstName, rp?.lastName].filter(value => typeof value === "string" && value.trim()).join(" ");
  const filledSteps = application
    ? visibleSteps(application).flatMap(step => (step.id !== "recapitulatif" && isStepComplete(application, step.id) ? [{ id: step.id, label: step.label }] : []))
    : [];

  return (
    <div className={styles.page}>
      <Link href="/equipe" className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" /> Tous les joueurs
      </Link>

      <Plaque className={styles.hero} rivets="none">
        <div className={styles.banner}>{banner && <Image src={banner} alt="" fill sizes="1100px" className={styles.bannerImage} />}</div>
        <div className={styles.heroBody}>
          <Image src={avatarUrl(player, 128)} alt="" width={84} height={84} className={styles.heroAvatar} />
          <div className={styles.heroText}>
            <div className={styles.heroName}>
              <h1>{displayName(player)}</h1>
              {player.rank !== "joueur" && <Badge tone="gold">{RANK_LABEL[player.rank]}</Badge>}
              {!player.inGuild && <Badge tone="danger">A quitté le Discord</Badge>}
            </div>
            <span className={styles.heroMeta}>
              @{player.username} · ID {player.id} · inscrit le {formatDate(player.createdAt)}
            </span>
            {rpName && <span className={styles.heroRp}>{rpName}</span>}
          </div>
          <div className={styles.heroStatus}>
            <ProfilePresence subjectId={player.id} />
            <Badge tone={BADGE_TONE[badge]} size="lg">{BADGE_LABEL[badge]}</Badge>
          </div>
        </div>
      </Plaque>

      {blacklisted && (
        <p className={styles.alert}>
          <strong>
            Blacklisté le {formatDate(blacklisted.createdAt)}
            {blacklisted.source === "bot" ? " depuis le bot Discord" : ""}
          </strong>
          {blacklisted.reason ? <em>« {blacklisted.reason} »</em> : <span>Aucune raison indiquée.</span>}
        </p>
      )}
      {!blacklisted && application?.whitelistRevokedAt && (
        <p className={styles.alert}>
          <strong>Whitelist retirée le {formatDate(application.whitelistRevokedAt)}</strong>
          {application.whitelistRevokeReason && <em>« {application.whitelistRevokeReason} »</em>}
        </p>
      )}

      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          {application && wantsDossier(application) && (
            <p className={styles.dossier}>
              <FileStack size={18} aria-hidden="true" />
              <span>
                Reprend : <strong>{dossierTargetLabel(application.dossier, names) ?? "dossier pas encore rempli"}</strong>
              </span>
            </p>
          )}
          <Plaque className={styles.panel}>
            <DotsRow className={styles.dots} />
            <h2 className={styles.panelTitle}>Candidature</h2>
            {application ? (
              <>
                <p className={styles.panelMeta}>
                  {application.submittedAt ? `Envoyée le ${formatDate(application.submittedAt)}` : `Commencée le ${formatDate(application.createdAt)}, pas encore envoyée`}
                </p>
                {application.status === "refusee" && (
                  <div className={styles.refusal}>
                    <strong>Refusée le {formatDate(application.decidedAt ?? application.updatedAt)}</strong>
                    {!!application.refusalCriteria?.length && <span>{application.refusalCriteria.map(id => criteria[id] ?? id).join(" · ")}</span>}
                    {application.refusalComment && <em>« {application.refusalComment} »</em>}
                  </div>
                )}
                <ApplicationRecap application={application} user={player} names={names} editable={false} heading="h3" />
              </>
            ) : (
              <p className={styles.waiting}>Ce joueur n&apos;a pas encore commencé de candidature.</p>
            )}
          </Plaque>
        </div>

        <aside className={styles.sideColumn} aria-label="Décision et suivi">
          {application && canDecide && (
            <Plaque className={styles.panel}>
              <h2 className={styles.panelTitle}>Décision</h2>
              <DecisionPanel subjectId={player.id} applicationId={application.id} status={application.status} isAdmin={isAdmin} steps={filledSteps} criteria={activeCriteria.map(({ id, label }) => ({ id, label }))} />
            </Plaque>
          )}
          <Plaque className={styles.panel}>
            <h2 className={styles.panelTitle}>Notes internes</h2>
            <Notes subjectId={player.id} notes={noteViews} isAdmin={isAdmin} />
          </Plaque>
          <Plaque className={styles.panel}>
            <h2 className={styles.panelTitle}>Chronologie</h2>
            <Timeline entries={visibleEvents} criteria={criteria} />
          </Plaque>
          {canSanction && (
            <Plaque className={`${styles.panel} ${styles.dangerPanel}`} rivets="none">
              <h2 className={`${styles.panelTitle} ${styles.dangerTitle}`}>Compte</h2>
              <Sanctions subjectId={player.id} canRevoke={whitelisted} blacklisted={!!blacklisted} />
              <DeleteAccount subjectId={player.id} />
            </Plaque>
          )}
        </aside>
      </div>
    </div>
  );
}
