import { prisma } from "@/lib/prisma";
import type { Event } from "@prisma/client";
import { generateRawToken, hashToken } from "@/lib/tokens";
import { calculateAge } from "@/lib/profile";

const CONFIRM_TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export async function getConfirmedCount(eventId: string): Promise<number> {
  return prisma.eventRsvp.count({ where: { eventId, status: "CONFIRMED" } });
}

export async function getWaitlistedCount(eventId: string): Promise<number> {
  return prisma.eventRsvp.count({ where: { eventId, status: "WAITLISTED" } });
}

export async function getUserRsvp(eventId: string, userId: string) {
  return prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId } } });
}

export type RsvpRequestResult =
  | { ok: true; kind: "new_pending"; rawToken: string }
  | { ok: true; kind: "already_active"; status: "CONFIRMED" | "WAITLISTED" }
  | { ok: false; error: string };

/**
 * Starts the RSVP process: creates a PENDING row and returns a raw
 * confirmation token for the caller to email. Attendance is only granted
 * (CONFIRMED or WAITLISTED) once confirmRsvp() is called with that token —
 * this is the "confirmed once the RSVP email is answered" requirement, and
 * also means someone can't be signed up for an event just by knowing (or
 * guessing) another member's email address.
 */
export async function createRsvp(event: Event, userId: string): Promise<RsvpRequestResult> {
  if (event.status !== "OPEN") {
    return { ok: false, error: "RSVPs are not open for this event." };
  }
  if (event.startsAt < new Date()) {
    return { ok: false, error: "This event has already taken place." };
  }

  const existing = await getUserRsvp(event.id, userId);
  if (existing) {
    if (existing.status === "PENDING") {
      const rawToken = generateRawToken();
      const expires = new Date(Math.min(Date.now() + CONFIRM_TOKEN_TTL_MS, event.startsAt.getTime()));
      await prisma.eventRsvp.update({
        where: { id: existing.id },
        data: { confirmToken: hashToken(rawToken), confirmTokenExpires: expires },
      });
      return { ok: true, kind: "new_pending", rawToken };
    }
    if (existing.status === "CONFIRMED" || existing.status === "WAITLISTED") {
      return { ok: true, kind: "already_active", status: existing.status };
    }
    // CANCELLED — fall through to re-create a pending RSVP below.
  }

  const rawToken = generateRawToken();
  const expires = new Date(Math.min(Date.now() + CONFIRM_TOKEN_TTL_MS, event.startsAt.getTime()));
  const confirmToken = hashToken(rawToken);

  if (existing) {
    await prisma.eventRsvp.update({
      where: { id: existing.id },
      data: { status: "PENDING", confirmToken, confirmTokenExpires: expires },
    });
  } else {
    await prisma.eventRsvp.create({
      data: { eventId: event.id, userId, status: "PENDING", confirmToken, confirmTokenExpires: expires },
    });
  }

  return { ok: true, kind: "new_pending", rawToken };
}

export type ConfirmResult =
  | { ok: true; status: "CONFIRMED" | "WAITLISTED"; eventId: string; userId: string }
  | { ok: false; error: string };

export async function confirmRsvp(rawToken: string): Promise<ConfirmResult> {
  const hashed = hashToken(rawToken);
  const rsvp = await prisma.eventRsvp.findUnique({ where: { confirmToken: hashed } });

  if (!rsvp || rsvp.status !== "PENDING") {
    return { ok: false, error: "This confirmation link is invalid or has already been used." };
  }
  if (!rsvp.confirmTokenExpires || rsvp.confirmTokenExpires < new Date()) {
    return { ok: false, error: "This confirmation link has expired." };
  }

  const confirmedCount = await getConfirmedCount(rsvp.eventId);
  const event = await prisma.event.findUnique({ where: { id: rsvp.eventId } });
  const status = event && confirmedCount < event.capacity ? "CONFIRMED" : "WAITLISTED";

  await prisma.eventRsvp.update({
    where: { id: rsvp.id },
    data: { status, confirmToken: null, confirmTokenExpires: null },
  });

  return { ok: true, status, eventId: rsvp.eventId, userId: rsvp.userId };
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
  await prisma.eventRsvp.update({
    where: { id: existing.id },
    data: { status: "CANCELLED", confirmToken: null, confirmTokenExpires: null },
  });

  if (!wasConfirmed) return { promoted: null };

  const nextInLine = await prisma.eventRsvp.findFirst({
    where: { eventId, status: "WAITLISTED" },
    orderBy: { createdAt: "asc" },
  });

  if (!nextInLine) return { promoted: null };

  await prisma.eventRsvp.update({ where: { id: nextInLine.id }, data: { status: "CONFIRMED" } });
  return { promoted: { userId: nextInLine.userId } };
}

export type AttendeeProfile = {
  userId: string;
  name: string;
  age: number | null;
  city: string | null;
  photoUrl: string | null;
};

/**
 * Confirmed attendees with enough profile info to show a "who's going" card.
 * Callers must check the viewer is allowed to see this (see canViewAttendeeList)
 * before rendering — this function itself doesn't check.
 */
export async function getConfirmedAttendeeProfiles(eventId: string): Promise<AttendeeProfile[]> {
  const rsvps = await prisma.eventRsvp.findMany({
    where: { eventId, status: "CONFIRMED" },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              city: true,
              birthDate: true,
              photos: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });

  return rsvps.map((rsvp) => ({
    userId: rsvp.user.id,
    name: rsvp.user.name ?? "Member",
    age: rsvp.user.profile?.birthDate ? calculateAge(rsvp.user.profile.birthDate) : null,
    city: rsvp.user.profile?.city ?? null,
    photoUrl: rsvp.user.profile?.photos[0]?.url ?? null,
  }));
}

// Reciprocal visibility: you must have an active RSVP (confirmed or
// waitlisted) yourself before you can see who else is going.
export function canViewAttendeeList(viewerRsvpStatus: string | null | undefined): boolean {
  return viewerRsvpStatus === "CONFIRMED" || viewerRsvpStatus === "WAITLISTED";
}

export async function getAttendees(eventId: string) {
  const rsvps = await prisma.eventRsvp.findMany({
    where: { eventId, status: { in: ["PENDING", "CONFIRMED", "WAITLISTED"] } },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: {
              city: true,
              birthDate: true,
              photos: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });

  return rsvps.map((rsvp) => ({
    userId: rsvp.userId,
    status: rsvp.status,
    name: rsvp.user.name,
    email: rsvp.user.email,
    age: rsvp.user.profile?.birthDate ? calculateAge(rsvp.user.profile.birthDate) : null,
    city: rsvp.user.profile?.city ?? null,
    photoUrl: rsvp.user.profile?.photos[0]?.url ?? null,
  }));
}
