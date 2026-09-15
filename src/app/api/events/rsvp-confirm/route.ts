import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmRsvp } from "@/lib/rsvp";
import { sendRsvpConfirmationEmail, type EventEmailInfo } from "@/lib/mail";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${origin}/rsvp-confirmed?status=invalid`);
  }

  const result = await confirmRsvp(token);
  if (!result.ok) {
    return NextResponse.redirect(`${origin}/rsvp-confirmed?status=invalid`);
  }

  const [event, user] = await Promise.all([
    prisma.event.findUnique({ where: { id: result.eventId } }),
    prisma.user.findUnique({ where: { id: result.userId } }),
  ]);

  if (event && user) {
    const eventInfo: EventEmailInfo = {
      title: event.title,
      venue: event.venue,
      city: event.city,
      startsAt: event.startsAt,
      eventUrl: `${origin}/events/${event.slug}`,
    };
    try {
      await sendRsvpConfirmationEmail({
        to: user.email,
        name: user.name ?? "there",
        event: eventInfo,
        waitlisted: result.status === "WAITLISTED",
      });
    } catch (err) {
      console.error("Failed to send RSVP confirmation email", err);
    }
  }

  const eventSlug = event?.slug ?? "";
  return NextResponse.redirect(
    `${origin}/rsvp-confirmed?status=${result.status.toLowerCase()}&event=${eventSlug}`
  );
}
