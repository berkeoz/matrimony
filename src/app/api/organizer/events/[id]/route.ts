import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizer } from "@/lib/require-organizer";
import { organizerEventSchema } from "@/lib/validation";
import { parseWallClockDateTime } from "@/lib/datetime";
import { logAction } from "@/lib/audit";
import { sendEventUpdatedEmail, sendEventCancelledEmail, type EventEmailInfo } from "@/lib/mail";

async function requireOwnEvent(id: string, userId: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.organizerId !== userId) return null;
  return event;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireOrganizer();
  if (response) return response;

  const { id } = await params;
  const before = await requireOwnEvent(id, session!.user.id);
  if (!before) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = organizerEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const conflict = await prisma.event.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } });
  if (conflict) {
    return NextResponse.json({ error: "Another event already uses this slug." }, { status: 409 });
  }

  const { startsAt, ...rest } = parsed.data;
  const newStartsAt = parseWallClockDateTime(startsAt);

  // Editing a rejected event gives it a fresh review; an already-approved
  // event's edits don't need re-review.
  const reviewStatus = before.reviewStatus === "REJECTED" ? "PENDING" : before.reviewStatus;

  const event = await prisma.event.update({
    where: { id },
    data: { ...rest, priceCents: 0, startsAt: newStartsAt, reviewStatus },
  });

  const changes: string[] = [];
  if (before.startsAt.getTime() !== newStartsAt.getTime()) changes.push("the date/time");
  if (before.venue !== event.venue || before.city !== event.city) changes.push("the venue");
  const justCancelled = before.status !== "CANCELLED" && event.status === "CANCELLED";

  if ((changes.length > 0 || justCancelled) && event.reviewStatus === "APPROVED") {
    const origin = new URL(request.url).origin;
    const eventInfo: EventEmailInfo = {
      title: event.title,
      venue: event.venue,
      city: event.city,
      startsAt: event.startsAt,
      eventUrl: `${origin}/events/${event.slug}`,
    };
    const attendees = await prisma.eventRsvp.findMany({
      where: { eventId: event.id, status: { in: ["CONFIRMED", "WAITLISTED"] } },
      include: { user: { select: { name: true, email: true } } },
    });
    await Promise.all(
      attendees.map(async (rsvp) => {
        try {
          if (justCancelled) {
            await sendEventCancelledEmail({ to: rsvp.user.email, name: rsvp.user.name ?? "there", event: eventInfo });
          } else {
            await sendEventUpdatedEmail({ to: rsvp.user.email, name: rsvp.user.name ?? "there", event: eventInfo, changes });
          }
        } catch (err) {
          console.error("Failed to send event change email", err);
        }
      })
    );
  }

  await logAction({
    actorId: session!.user.id,
    action: "event.update",
    targetType: "Event",
    targetId: event.id,
    metadata: { title: event.title, changes, byOrganizer: true },
  });

  return NextResponse.json({ event });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireOrganizer();
  if (response) return response;

  const { id } = await params;
  const event = await requireOwnEvent(id, session!.user.id);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  await prisma.event.delete({ where: { id } });

  await logAction({
    actorId: session!.user.id,
    action: "event.delete",
    targetType: "Event",
    targetId: id,
    metadata: { title: event.title, slug: event.slug, byOrganizer: true },
  });

  return NextResponse.json({ ok: true });
}
