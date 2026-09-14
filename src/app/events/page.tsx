import Link from "next/link";
import type { Metadata } from "next";
import { getUpcomingEvents, getPastEvents, formatEventDate } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events — Evlilik Yolu",
  description: "Current and upcoming in-person meetups for the Evlilik Yolu community.",
};

export default function EventsPage() {
  const upcoming = getUpcomingEvents();
  const past = getPastEvents();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Events</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          In-person meetups organized by our team and verified community organizers. RSVP to reserve
          your spot — capacity is limited to keep every event comfortable and welcoming.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
          Upcoming ({upcoming.length})
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((event) => {
            const spotsLeft = event.capacity - event.rsvpCount;
            return (
              <Link
                key={event.slug}
                href={`/events/${event.slug}`}
                className="flex flex-col rounded-2xl border border-black/10 p-6 transition hover:border-rose-700 hover:shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                  {event.city}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{event.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  {formatEventDate(event.startsAt)}
                </p>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{event.description}</p>
                <p className="mt-4 text-xs font-medium text-neutral-500">
                  Organized by {event.organizer}
                </p>
                <p
                  className={`mt-2 text-xs font-semibold ${
                    spotsLeft <= 0 ? "text-neutral-400" : "text-rose-700"
                  }`}
                >
                  {spotsLeft <= 0
                    ? "Waitlist only"
                    : `${spotsLeft} of ${event.capacity} spots left`}
                </p>
              </Link>
            );
          })}
          {upcoming.length === 0 && (
            <p className="text-sm text-neutral-500">No upcoming events right now — check back soon.</p>
          )}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Past events ({past.length})
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {past.map((event) => (
            <Link
              key={event.slug}
              href={`/events/${event.slug}`}
              className="flex flex-col rounded-2xl border border-black/10 p-6 opacity-70 transition hover:opacity-100"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {event.city}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{event.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {formatEventDate(event.startsAt)}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
