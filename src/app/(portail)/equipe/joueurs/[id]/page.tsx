import { ArrowLeft, FileStack } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Badge, DotsRow, Plaque } from "@/components/plaque";
import { formatDate } from "@/components/portal/application-status";
import { RANK_LABEL } from "@/components/portal/profile-card";
import { BADGE_LABEL, BADGE_TONE, staffBadge } from "@/components/staff/badges";
import { ProfilePresence } from "@/components/staff/live-presence";
import { Timeline } from "@/components/staff/timeline";
import { criterionLabel } from "@/content/staff";
import { db, schema } from "@/db";
import { dossierTargetLabel, isStepComplete, visibleSteps, wantsDossier } from "@/lib/application";
import { getLatestApplication } from "@/lib/applications";
import { avatarUrl, bannerUrl, displayName } from "@/lib/discord-cdn";
import { markViewed } from "@/lib/review";
import { hasRank, requireUser } from "@/lib/session";
import { canDeleteNote, notesFor, timeline } from "@/lib/staff";
import { ApplicationRecap } from "../../../portail/candidature/recap";
import { DecisionPanel } from "./decision-panel";
import styles from "./fiche.module.css";
import type { NoteView } from "./notes";
import { Notes } from "./notes";

export const metadata: Metadata = { title: "Fiche joueur" };

const noteDate = (date: Date) => date.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export default async function FichePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const viewer = await requireUser({ rank: "recruteur" });
  const [player] = await db().select().from(schema.users).where(eq(schema.users.id, id));
  if (!player) notFound();

  const application = await getLatestApplication(player.id);
  if (application) await markViewed(application, viewer);
  const isStaff = hasRank(viewer, "staff");

  const [events, notes] = await Promise.all([timeline(player.id), notesFor(player.id, viewer)]);
  // Un recruteur ne doit pas deviner l'existence d'une note réservée au staff.
  const visibleEvents = isStaff ? events : events.filter(event => !(event.type === "note.ajoutee" && (event.data as { visibilite?: string }).visibilite === "staff"));
  const noteViews: NoteView[] = notes.map(note => ({
    id: note.id,
    content: note.content,
    visibility: note.visibility,
    date: noteDate(note.createdAt),
    authorId: note.authorId,
    authorName: note.authorName,
    authorAvatar: note.authorAvatar,
    canDelete: canDeleteNote(note, viewer) && (isStaff || note.visibility === "equipe"),
  }));

  const badge = staffBadge(application);
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

      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          {application && wantsDossier(application) && (
            <p className={styles.dossier}>
              <FileStack size={18} aria-hidden="true" />
              <span>
                Reprend : <strong>{dossierTargetLabel(application.dossier) ?? "dossier pas encore rempli"}</strong>
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
                    {!!application.refusalCriteria?.length && <span>{application.refusalCriteria.map(criterionLabel).join(" · ")}</span>}
                    {application.refusalComment && <em>« {application.refusalComment} »</em>}
                  </div>
                )}
                <ApplicationRecap application={application} user={player} editable={false} />
              </>
            ) : (
              <p className={styles.waiting}>Ce joueur n&apos;a pas encore commencé de candidature.</p>
            )}
          </Plaque>
        </div>

        <aside className={styles.sideColumn}>
          {application && (
            <Plaque className={styles.panel}>
              <h2 className={styles.panelTitle}>Décision</h2>
              <DecisionPanel subjectId={player.id} applicationId={application.id} status={application.status} isStaff={isStaff} steps={filledSteps} />
            </Plaque>
          )}
          <Plaque className={styles.panel}>
            <h2 className={styles.panelTitle}>Notes internes</h2>
            <Notes subjectId={player.id} notes={noteViews} isStaff={isStaff} />
          </Plaque>
          <Plaque className={styles.panel}>
            <h2 className={styles.panelTitle}>Chronologie</h2>
            <Timeline entries={visibleEvents} />
          </Plaque>
        </aside>
      </div>
    </div>
  );
}
