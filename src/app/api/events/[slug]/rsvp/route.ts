import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRsvp, cancelRsvp } from "@/lib/rsvp";
import { getProfile, isProfileComplete } from "@/lib/profile";
import { hasActiveSubscription } from "@/lib/subscription";
import { sendRsvpPendingEmail, sendWaitlistPromotedEmail, type EventEmailInfo } from "@/lib/mail";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const profile = await getProfile(session.user.id);
  if (!isProfileComplete(profile)) {
    return NextResponse.json(
      { error: "Complete your profile before RSVPing to events.", code: "PROFILE_INCOMPLETE" },
      { status: 403 }
    );
  }

  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (event.reviewStatus !== "APPROVED") {
    return NextResponse.json({ error: "This event isn't published yet." }, { status: 404 });
  }

  if (event.priceCents > 0 && !(await hasActiveSubscription(session.user.id))) {
    return NextResponse.json(
      {
        error:
          "Online payments for this event aren't available yet — it's free for subscribers in the meantime.",
        code: "PAYMENT_NOT_AVAILABLE",
      },
      { status: 403 }
    );
  }

  const result = await createRsvp(event, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (result.kind === "already_active") {
    return NextResponse.json({ status: result.status });
  }

  const origin = new URL(request.url).origin;
  const eventInfo: EventEmailInfo = {
    title: event.title,
    venue: event.venue,
    city: event.city,
    startsAt: event.startsAt,
    eventUrl: `${origin}/events/${event.slug}`,
  };
  try {
    await sendRsvpPendingEmail({
      to: session.user.email!,
      name: session.user.name ?? "there",
      event: eventInfo,
      confirmUrl: `${origin}/api/events/rsvp-confirm?token=${result.rawToken}`,
    });
  } catch (err) {
    console.error("Failed to send RSVP confirmation email", err);
  }

  return NextResponse.json({ status: "PENDING" });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const { promoted } = await cancelRsvp(event.id, session.user.id);

  if (promoted) {
    const promotedUser = await prisma.user.findUnique({ where: { id: promoted.userId } });
    if (promotedUser) {
      const origin = new URL(request.url).origin;
      try {
        await sendWaitlistPromotedEmail({
          to: promotedUser.email,
          name: promotedUser.name ?? "there",
          event: {
            title: event.title,
            venue: event.venue,
            city: event.city,
            startsAt: event.startsAt,
            eventUrl: `${origin}/events/${event.slug}`,
          },
        });
      } catch (err) {
        console.error("Failed to send waitlist promotion email", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
