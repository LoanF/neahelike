"use client";

import { Lock, Trash2, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Badge, Button, cx, TextAreaField } from "@/components/plaque";
import { useActionForm } from "@/components/use-action-form";
import type { NoteVisibility } from "@/db/schema";
import { avatarUrl } from "@/lib/discord-cdn";
import type { NoteState } from "../../actions";
import { addNoteAction, deleteNoteAction } from "../../actions";
import styles from "./fiche.module.css";

export interface NoteView {
  id: string;
  content: string;
  visibility: NoteVisibility;
  date: string;
  authorId: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  canDelete: boolean;
}

function AddButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" size="sm" loading={pending}>
      Ajouter la note
    </Button>
  );
}

const VISIBILITY = [
  { id: "equipe", label: "Toute l'équipe", hint: "Recruteurs et admins", icon: Users },
  { id: "admin", label: "Admins uniquement", hint: "Invisible pour les recruteurs", icon: Lock },
] as const;

/** Notes internes : jamais visibles par le joueur. Un admin choisit si une note reste entre admins. */
export function Notes({ subjectId, notes, isAdmin }: { subjectId: string; notes: NoteView[]; isAdmin: boolean }) {
  const [state, onSubmit, pending] = useActionForm<NoteState>(addNoteAction, null);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<NoteVisibility>("equipe");

  // Note ajoutée : on vide le champ.
  useEffect(() => {
    if (state && !state.error) setContent("");
  }, [state]);

  return (
    <div className={styles.notes}>
      <form onSubmit={onSubmit} className={styles.noteForm}>
        <input type="hidden" name="subjectId" value={subjectId} />
        <TextAreaField
          name="content"
          label="Nouvelle note"
          maxLength={2000}
          placeholder="Impression, point à vérifier à l'entretien, échange avec le joueur…"
          value={content}
          onChange={event => setContent(event.target.value)}
          error={state?.error}
        />
        {isAdmin ? (
          <fieldset className={styles.visibility}>
            <legend>Visible par</legend>
            {VISIBILITY.map(option => {
              const Icon = option.icon;
              return (
                <label key={option.id} className={cx(styles.visibilityOption, visibility === option.id && styles.visibilityActive)}>
                  <input type="radio" name="visibility" value={option.id} checked={visibility === option.id} onChange={() => setVisibility(option.id)} />
                  <Icon size={15} aria-hidden="true" />
                  <span>
                    {option.label}
                    <small>{option.hint}</small>
                  </span>
                </label>
              );
            })}
          </fieldset>
        ) : (
          <p className={styles.noteHint}>
            <Users size={14} aria-hidden="true" /> Visible par toute l&apos;équipe, jamais par le joueur.
          </p>
        )}
        <div className={styles.noteSubmit}>
          <AddButton pending={pending} />
        </div>
      </form>

      {notes.length === 0 ? (
        <p className={styles.waiting}>Aucune note pour l&apos;instant.</p>
      ) : (
        <ul className={styles.noteList}>
          {notes.map(note => (
            <li key={note.id} className={cx(styles.note, note.visibility === "admin" && styles.noteAdmin)}>
              <div className={styles.noteHead}>
                {note.authorId && <Image src={avatarUrl({ id: note.authorId, avatar: note.authorAvatar }, 32)} alt="" width={22} height={22} className={styles.noteAvatar} />}
                <span className={styles.noteAuthor}>{note.authorName ?? "Ancien membre"}</span>
                {note.visibility === "admin" && (
                  <Badge tone="gold">
                    <Lock size={11} aria-hidden="true" /> Admins
                  </Badge>
                )}
                <span className={styles.noteDate}>{note.date}</span>
                {note.canDelete && (
                  <form action={deleteNoteAction} className={styles.noteDelete}>
                    <input type="hidden" name="noteId" value={note.id} />
                    <button type="submit" aria-label="Supprimer la note" title="Supprimer la note">
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </form>
                )}
              </div>
              <p className={styles.noteContent}>{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
