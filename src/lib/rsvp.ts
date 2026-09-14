import { prisma } from "@/lib/prisma";
import type { Event } from "@prisma/client";

export async function getConfirmedCount(eventId: string): Promise<number> {
  return prisma.eventRsvp.count({ where: { eventId, status: "CONFIRMED" } });
}

export async function getWaitlistedCount(eventId: string): Promise<number> {
  return prisma.eventRsvp.count({ where: { eventId, status: "WAITLISTED" } });
}

export async function getUserRsvp(eventId: string, userId: string) {
  return prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId } } });
}

export type RsvpResult =
  | { ok: true; status: "CONFIRMED" | "WAITLISTED"; alreadyExisted: boolean }
  | { ok: false; error: string };

export async function createRsvp(event: Event, userId: string): Promise<RsvpResult> {
  if (event.status !== "OPEN") {
    return { ok: false, error: "RSVPs are not open for this event." };
  }
  if (event.startsAt < new Date()) {
    return { ok: false, error: "This event has already taken place." };
  }

  const existing = await getUserRsvp(event.id, userId);
  if (existing && existing.status !== "CANCELLED") {
    return { ok: true, status: existing.status, alreadyExisted: true };
  }

  const confirmedCount = await getConfirmedCount(event.id);
  const status = confirmedCount < event.capacity ? "CONFIRMED" : "WAITLISTED";

  if (existing) {
    await prisma.eventRsvp.update({ where: { id: existing.id }, data: { status } });
  } else {
    await prisma.eventRsvp.create({ data: { eventId: event.id, userId, status } });
  }

  return { ok: true, status, alreadyExisted: false };
}

export type CancelResult = {
  promoted: { userId: string } | null;
};

export async function cancelRsvp(eventId: string, userId: string): Promise<CancelResult> {
  const existing = await getUserRsvp(eventId, userId);
  if (!existing || existing.status === "CANCELLED") {
    return { promoted: null };
  }

  const wasConfirmed = existing.status === "CONFIRMED";
  await prisma.eventRsvp.update({ where: { id: existing.id }, data: { status: "CANCELLED" } });

  if (!wasConfirmed) return { promoted: null };

  const nextInLine = await prisma.eventRsvp.findFirst({
    where: { eventId, status: "WAITLISTED" },
    orderBy: { createdAt: "asc" },
  });

  if (!nextInLine) return { promoted: null };

  await prisma.eventRsvp.update({ where: { id: nextInLine.id }, data: { status: "CONFIRMED" } });
  return { promoted: { userId: nextInLine.userId } };
}

export async function getAttendees(eventId: string) {
  return prisma.eventRsvp.findMany({
    where: { eventId, status: { in: ["CONFIRMED", "WAITLISTED"] } },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}
