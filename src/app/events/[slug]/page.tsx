import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEventBySlug } from "@/lib/events";
import { formatWallClockDate } from "@/lib/datetime";
import { getConfirmedCount, getUserRsvp, getConfirmedAttendeeProfiles, canViewAttendeeList } from "@/lib/rsvp";
import { getProfile, isProfileComplete } from "@/lib/profile";
import { hasActiveSubscription } from "@/lib/subscription";
import { auth } from "@/lib/auth";
import RsvpButton from "@/components/RsvpButton";
import AttendeeList from "@/components/AttendeeList";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found — Evlilik Yolu" };
  return {
    title: `${event.title} — Evlilik Yolu`,
    description: event.description,
  };
}

const statusLabel: Record<string, string> = {
  CANCELLED: "Cancelled",
  CLOSED: "RSVPs closed",
  COMPLETED: "Completed",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const session = await auth();
  const [confirmedCount, userRsvp, profile, subscribed] = await Promise.all([
    getConfirmedCount(event.id),
    session?.user ? getUserRsvp(event.id, session.user.id) : Promise.resolve(null),
    session?.user ? getProfile(session.user.id) : Promise.resolve(null),
    session?.user ? hasActiveSubscription(session.user.id) : Promise.resolve(false),
  ]);
  const profileComplete = isProfileComplete(profile);

  const isPast = event.startsAt < new Date();
  const spotsLeft = event.capacity - confirmedCount;
  const rsvpOpen = event.status === "OPEN" && !isPast;
  const initialRsvpStatus =
    userRsvp && userRsvp.status !== "CANCELLED"
      ? (userRsvp.status as "PENDING" | "CONFIRMED" | "WAITLISTED")
      : "NONE";

  const canSeeAttendees = canViewAttendeeList(userRsvp?.status);
  const attendees = canSeeAttendees ? await getConfirmedAttendeeProfiles(event.id) : [];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.venue}, ${event.city}`
  )}`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/events" className="text-sm font-semibold text-rose-700 hover:underline">
        ← All events
      </Link>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-rose-700">
        {event.city} ·{" "}
        {event.status !== "OPEN" ? statusLabel[event.status] : isPast ? "Past event" : "Upcoming"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{event.title}</h1>

      <dl className="mt-6 grid gap-4 rounded-2xl border border-black/10 p-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase text-neutral-500">Date &amp; time</dt>
          <dd className="mt-1 text-sm">{formatWallClockDate(event.startsAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-neutral-500">Venue</dt>
          <dd className="mt-1 text-sm">
            {event.venue}{" "}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-700 hover:underline"
            >
              (view on map ↗)
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-neutral-500">Organizer</dt>
          <dd className="mt-1 text-sm">{event.organizer}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-neutral-500">Price</dt>
          <dd className="mt-1 text-sm">
            {event.priceCents === 0
              ? "Free"
              : `$${(event.priceCents / 100).toFixed(2)}${subscribed ? " (free for you — subscriber)" : ""}`}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-neutral-500">Capacity</dt>
          <dd className="mt-1 text-sm">
            {confirmedCount} / {event.capacity} RSVP&apos;d
            {rsvpOpen && (
              <span className={spotsLeft <= 0 ? "text-neutral-400" : "text-rose-700"}>
                {" "}
                ({spotsLeft <= 0 ? "waitlist only" : `${spotsLeft} spots left`})
              </span>
            )}
          </dd>
        </div>
      </dl>

      <p className="mt-8 text-neutral-700 dark:text-neutral-300">{event.longDescription}</p>

      <div className="mt-10">
        {isPast ? (
          <p className="text-sm text-neutral-500">This event has already taken place.</p>
        ) : event.status === "CANCELLED" ? (
          <p className="text-sm text-neutral-500">This event has been cancelled.</p>
        ) : event.status === "CLOSED" ? (
          <p className="text-sm text-neutral-500">RSVPs are closed for this event.</p>
        ) : session?.user && !profileComplete && initialRsvpStatus === "NONE" ? (
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Complete your profile to RSVP to events.
            </p>
            <Link
              href="/profile"
              className="mt-3 inline-block rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
            >
              Complete your profile
            </Link>
          </div>
        ) : (
          <RsvpButton
            slug={event.slug}
            initialStatus={initialRsvpStatus}
            isLoggedIn={Boolean(session?.user)}
            priceCents={event.priceCents}
            hasActiveSubscription={subscribed}
          />
        )}
      </div>

      {canSeeAttendees && (
        <div className="mt-12 border-t border-black/10 pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
            Who&apos;s going ({attendees.length})
          </h2>
          <div className="mt-4">
            <AttendeeList attendees={attendees} />
          </div>
        </div>
      )}
    </div>
  );
}
