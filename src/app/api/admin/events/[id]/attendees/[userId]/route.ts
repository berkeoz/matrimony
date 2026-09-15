import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cancelRsvp } from "@/lib/rsvp";
import { sendWaitlistPromotedEmail, type EventEmailInfo } from "@/lib/mail";
import { logAction } from "@/lib/audit";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id, userId } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const isOwningOrganizer = session.user.role === "ORGANIZER" && event.organizerId === session.user.id;
  if (session.user.role !== "ADMIN" && !isOwningOrganizer) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { promoted } = await cancelRsvp(id, userId);

  await logAction({
    actorId: session.user.id,
    action: "event.attendee.remove",
    targetType: "Event",
    targetId: id,
    metadata: { removedUserId: userId, eventTitle: event.title },
  });

  if (promoted) {
    const promotedUser = await prisma.user.findUnique({ where: { id: promoted.userId } });
    if (promotedUser) {
      const origin = new URL(request.url).origin;
      const eventInfo: EventEmailInfo = {
        title: event.title,
        venue: event.venue,
        city: event.city,
        startsAt: event.startsAt,
        eventUrl: `${origin}/events/${event.slug}`,
      };
      try {
        await sendWaitlistPromotedEmail({
          to: promotedUser.email,
          name: promotedUser.name ?? "there",
          event: eventInfo,
        });
      } catch (err) {
        console.error("Failed to send waitlist promotion email", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
