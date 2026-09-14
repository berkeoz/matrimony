import type { Event } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type { Event };

export async function getUpcomingEvents(limit?: number): Promise<Event[]> {
  const events = await prisma.event.findMany({
    where: { startsAt: { gte: new Date() }, status: { not: "CANCELLED" } },
    orderBy: { startsAt: "asc" },
    take: limit,
  });
  return events;
}

export async function getPastEvents(): Promise<Event[]> {
  return prisma.event.findMany({
    where: { startsAt: { lt: new Date() }, status: { not: "CANCELLED" } },
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
