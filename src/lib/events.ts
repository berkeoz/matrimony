import type { Event } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type { Event };

// Prefilled as the default "Format" text for new events — admins/organizers
// can edit or clear it per event, but this is the expected default shape.
export const DEFAULT_EVENT_FORMAT =
  "Speed-dating format: about 5–10 minutes one-on-one with each person, then switch to the next partner. No pressure to decide anything at the event itself — how you follow up afterward is entirely up to you.";

export async function getUpcomingEvents(limit?: number): Promise<Event[]> {
  const events = await prisma.event.findMany({
    where: { startsAt: { gte: new Date() }, status: { not: "CANCELLED" }, reviewStatus: "APPROVED" },
    orderBy: { startsAt: "asc" },
    take: limit,
  });
  return events;
}

export async function getPastEvents(): Promise<Event[]> {
  return prisma.event.findMany({
    where: { startsAt: { lt: new Date() }, status: { not: "CANCELLED" }, reviewStatus: "APPROVED" },
    orderBy: { startsAt: "desc" },
  });
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  return prisma.event.findUnique({ where: { slug } });
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
