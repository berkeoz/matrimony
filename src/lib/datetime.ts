/**
 * Event times are stored and displayed as a "naive" wall-clock time in the
 * event's own city — never converted for the viewer's or server's timezone.
 * We use UTC as a no-op storage/display timezone: the UTC digits of a Date
 * ARE the intended local clock digits (e.g. 18:00 Istanbul is stored as
 * 18:00 UTC, and always displayed back as 18:00, regardless of who's
 * looking or where the server runs).
 */

export function parseWallClockDateTime(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

export function toDateTimeLocalValue(date: Date): string {
  return date.toISOString().slice(0, 16);
}

export function formatWallClockDate(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
