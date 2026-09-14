import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEventReminderEmail, type EventEmailInfo } from "@/lib/mail";

// Runs once a day (see vercel.json). Emails everyone CONFIRMED for an event
// happening "tomorrow" (by the event's own stored wall-clock date) who
// hasn't already been reminded.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tomorrowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  const tomorrowEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2)
  );

  const events = await prisma.event.findMany({
    where: { status: "OPEN", startsAt: { gte: tomorrowStart, lt: tomorrowEnd } },
  });

  const origin = new URL(request.url).origin;
  let sent = 0;

  for (const event of events) {
    const rsvps = await prisma.eventRsvp.findMany({
      where: { eventId: event.id, status: "CONFIRMED", remindedAt: null },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const eventInfo: EventEmailInfo = {
      title: event.title,
      venue: event.venue,
      city: event.city,
      startsAt: event.startsAt,
      eventUrl: `${origin}/events/${event.slug}`,
    };

    for (const rsvp of rsvps) {
      try {
        await sendEventReminderEmail({
          to: rsvp.user.email,
          name: rsvp.user.name ?? "there",
          event: eventInfo,
        });
        await prisma.eventRsvp.update({ where: { id: rsvp.id }, data: { remindedAt: new Date() } });
        sent += 1;
      } catch (err) {
        console.error("Failed to send reminder email", err);
      }
    }
  }

  return NextResponse.json({ ok: true, eventsChecked: events.length, remindersSent: sent });
}
