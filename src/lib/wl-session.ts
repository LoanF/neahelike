/*
 * Créneau de la prochaine session de whitelist, choisi par le recruteur à la validation écrite.
 * Saisi et affiché à l'heure de Paris, quel que soit le fuseau du serveur (UTC sur Vercel).
 */

export const WL_TIME_ZONE = "Europe/Paris";

export interface WlSlot {
  start: Date;
  end: Date;
}

/** Décalage du fuseau à cet instant, en millisecondes (heure de Paris − UTC). */
function zoneOffset(at: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: WL_TIME_ZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(at)
      .map(part => [part.type, part.value]),
  );
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
  return asUtc - Math.floor(at.getTime() / 60_000) * 60_000;
}

/** « 2026-10-25 » + « 21:00 », heure de Paris → instant exact. `null` si la saisie n'est pas valide. */
function parisTime(date: string, time: string) {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const clock = /^(\d{2}):(\d{2})$/.exec(time);
  if (!day || !clock) return null;
  const [year, month, dayOfMonth, hour, minute] = [...day.slice(1), ...clock.slice(1)].map(Number);
  if (month < 1 || month > 12 || dayOfMonth < 1 || dayOfMonth > 31 || hour > 23 || minute > 59) return null;
  const guess = Date.UTC(year, month - 1, dayOfMonth, hour, minute);
  // Deux passes : le décalage peut changer entre l'estimation et l'heure réelle (passage à l'heure d'été).
  const first = guess - zoneOffset(new Date(guess));
  return new Date(guess - zoneOffset(new Date(first)));
}

/** Créneau saisi dans le formulaire de validation, ou un message d'erreur. */
export function parseWlSlot(date: string, from: string, to: string, now = new Date()): WlSlot | { error: string } {
  if (!date || !from || !to) return { error: "Indique la date et les heures de la prochaine session de whitelist." };
  const start = parisTime(date, from);
  const end = parisTime(date, to);
  if (!start || !end) return { error: "Date ou heure de la session invalide." };
  if (end <= start) return { error: "L'heure de fin de la session doit être après l'heure de début." };
  if (end <= now) return { error: "Cette session est déjà passée : choisis une date à venir." };
  return { start, end };
}

/** « samedi 25 octobre, de 21 h 00 à 23 h 00 » (heure de Paris). */
export function formatWlSlot(slot: WlSlot) {
  const day = slot.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: WL_TIME_ZONE });
  const hour = (date: Date) => date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: WL_TIME_ZONE }).replace(":", " h ");
  return `${day}, de ${hour(slot.start)} à ${hour(slot.end)}`;
}

/** Créneau enregistré sur la candidature, s'il y en a un. */
export function storedWlSlot(application: { interviewSlotStart: Date | null; interviewSlotEnd: Date | null }): WlSlot | null {
  return application.interviewSlotStart && application.interviewSlotEnd ? { start: application.interviewSlotStart, end: application.interviewSlotEnd } : null;
}
