import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { cancelRsvp } from "@/lib/rsvp";
import { sendWaitlistPromotedEmail, type EventEmailInfo } from "@/lib/mail";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id, userId } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const { promoted } = await cancelRsvp(id, userId);

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
