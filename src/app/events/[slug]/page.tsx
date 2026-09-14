import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEventBySlug } from "@/lib/events";
import { formatWallClockDate } from "@/lib/datetime";

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

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const isPast = event.startsAt < new Date();
  const spotsLeft = event.capacity - event.rsvpCount;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/events" className="text-sm font-semibold text-rose-700 hover:underline">
        ← All events
      </Link>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-rose-700">
        {event.city} · {isPast ? "Past event" : "Upcoming"}
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
            {event.rsvpCount} / {event.capacity} RSVP&apos;d
            {!isPast && (
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
        ) : (
          <Link
            href="/signup"
            className="inline-block rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
          >
            {spotsLeft <= 0 ? "Join waitlist" : "RSVP to this event"}
          </Link>
        )}
        <p className="mt-3 text-xs text-neutral-500">
          You&apos;ll need a verified account to RSVP.
        </p>
      </div>
    </div>
  );
}
