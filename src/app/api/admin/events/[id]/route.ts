import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { eventSchema } from "@/lib/validation";
import { parseWallClockDateTime } from "@/lib/datetime";
import { sendEventUpdatedEmail, sendEventCancelledEmail, type EventEmailInfo } from "@/lib/mail";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const before = await prisma.event.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const conflict = await prisma.event.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (conflict) {
    return NextResponse.json({ error: "Another event already uses this slug." }, { status: 409 });
  }

  const { startsAt, ...rest } = parsed.data;
  const newStartsAt = parseWallClockDateTime(startsAt);

  const event = await prisma.event.update({
    where: { id },
    data: { ...rest, startsAt: newStartsAt },
  });

  const changes: string[] = [];
  if (before.startsAt.getTime() !== newStartsAt.getTime()) changes.push("the date/time");
  if (before.venue !== event.venue || before.city !== event.city) changes.push("the venue");

  const justCancelled = before.status !== "CANCELLED" && event.status === "CANCELLED";

  if (changes.length > 0 || justCancelled) {
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
            await sendEventCancelledEmail({
              to: rsvp.user.email,
              name: rsvp.user.name ?? "there",
              event: eventInfo,
            });
          } else {
            await sendEventUpdatedEmail({
              to: rsvp.user.email,
              name: rsvp.user.name ?? "there",
              event: eventInfo,
              changes,
            });
          }
        } catch (err) {
          console.error("Failed to send event change email", err);
        }
      })
    );
  }

  return NextResponse.json({ event });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
