"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { fetchNotifications, markNotificationsRead } from "@/app/(portail)/actions";
import { cx } from "@/components/plaque";
import type { Notification } from "@/db/schema";
import styles from "./notification-bell.module.css";

const REFRESH_MS = 60_000;
const relative = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

function ago(date: Date) {
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  return "à l'instant";
}

type Item = Pick<Notification, "id" | "title" | "body" | "href" | "readAt" | "createdAt">;

/** Cloche du portail : pastille du nombre non lu, panneau des dernières notifications. */
export function NotificationBell({ initial }: { initial: { items: Item[]; unread: number } }) {
  const [data, setData] = useState(initial);
  const [open, setOpen] = useState(false);
  // Notifications non lues au moment de l'ouverture : elles restent mises en avant tant que le panneau est ouvert.
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => setData(initial), [initial]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchNotifications().then(setData, () => {});
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        setOpen(false);
        // Au clavier, le focus revient sur la cloche au lieu de se perdre en haut de la page.
        button.current?.focus();
      } else if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const toggle = () => {
    if (!open && data.unread > 0) {
      setFresh(new Set(data.items.filter(item => !item.readAt).map(item => item.id)));
      setData(current => ({ unread: 0, items: current.items.map(item => ({ ...item, readAt: item.readAt ?? new Date() })) }));
      void markNotificationsRead().catch(() => {});
    }
    setOpen(value => !value);
  };

  const label = data.unread > 0 ? `Notifications, ${data.unread} non lue${data.unread > 1 ? "s" : ""}` : "Notifications";

  return (
    <div ref={root} className={styles.root}>
      <button ref={button} type="button" className={cx(styles.bell, open && styles.bellOpen)} aria-label={label} aria-expanded={open} aria-controls={panelId} onClick={toggle}>
        <Bell size={20} aria-hidden="true" />
        {data.unread > 0 && <span className={styles.count}>{data.unread > 9 ? "9+" : data.unread}</span>}
      </button>
      {open && (
        <div id={panelId} className={styles.panel} role="dialog" aria-label="Notifications">
          <span className={styles.title}>Notifications</span>
          {data.items.length === 0 ? (
            <p className={styles.empty}>Rien de nouveau. Tu seras prévenu ici et sur Discord à chaque étape de ta candidature.</p>
          ) : (
            <ul className={styles.list}>
              {data.items.map(item => {
                const content = (
                  <>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <span className={styles.itemBody}>{item.body}</span>
                    <span className={styles.itemTime}>{ago(item.createdAt)}</span>
                  </>
                );
                return (
                  <li key={item.id} className={cx(styles.item, fresh.has(item.id) && styles.itemFresh)}>
                    {item.href ? (
                      <Link href={item.href} className={styles.itemLink} onClick={() => setOpen(false)}>
                        {content}
                      </Link>
                    ) : (
                      <div className={styles.itemLink}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
