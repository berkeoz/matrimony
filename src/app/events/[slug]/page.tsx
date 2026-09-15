import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEventBySlug } from "@/lib/events";
import { formatWallClockDate } from "@/lib/datetime";
import { getConfirmedCount, getUserRsvp } from "@/lib/rsvp";
import { auth } from "@/lib/auth";
import RsvpButton from "@/components/RsvpButton";

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
  const [confirmedCount, userRsvp] = await Promise.all([
    getConfirmedCount(event.id),
    session?.user ? getUserRsvp(event.id, session.user.id) : Promise.resolve(null),
  ]);

  const isPast = event.startsAt < new Date();
  const spotsLeft = event.capacity - confirmedCount;
  const rsvpOpen = event.status === "OPEN" && !isPast;
  const initialRsvpStatus =
    userRsvp && userRsvp.status !== "CANCELLED"
      ? (userRsvp.status as "PENDING" | "CONFIRMED" | "WAITLISTED")
      : "NONE";

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
          <dd className="mt-1 text-sm">{event.venue}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-neutral-500">Organizer</dt>
          <dd className="mt-1 text-sm">{event.organizer}</dd>
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
        ) : (
          <RsvpButton
            slug={event.slug}
            initialStatus={initialRsvpStatus}
            isLoggedIn={Boolean(session?.user)}
          />
        )}
      </div>
    </div>
  );
}
