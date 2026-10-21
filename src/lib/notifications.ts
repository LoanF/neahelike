import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { NotificationText } from "@/content/notifications";
import { db, schema } from "@/db";

/** Nombre de notifications gardées dans la cloche. */
const LIMIT = 20;

export async function notify(userId: string, notification: NotificationText) {
  await db().insert(schema.notifications).values({ userId, ...notification });
}

export async function latestNotifications(userId: string) {
  const [items, [{ unread }]] = await Promise.all([
    db().select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt)).limit(LIMIT),
    db()
      .select({ unread: sql<number>`count(*)::int` })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt))),
  ]);
  return { items, unread };
}

export async function markAllRead(userId: string) {
  await db()
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt)));
}
