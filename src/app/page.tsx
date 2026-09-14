import Link from "next/link";
import { getUpcomingEvents, formatEventDate } from "@/lib/events";

const steps = [
  {
    title: "Create a verified profile",
    description:
      "Share your background, values, and what you're looking for. Every profile is reviewed and photos are moderated before going live.",
  },
  {
    title: "Discover thoughtful matches",
    description:
      "Browse curated suggestions based on city, memleket, education, and what matters most to you — not endless swiping.",
  },
  {
    title: "Connect with intention",
    description:
      "Express interest, and when it's mutual, messaging opens up. Family involvement is optional and always on your terms.",
  },
];

const trustPoints = [
  {
    title: "Verified members",
    description: "Phone and identity verification badges help you know who you're really talking to.",
  },
  {
    title: "Privacy by default",
    description: "You control who sees your full profile and photos until you choose to share more.",
  },
  {
    title: "Family friendly",
    description: "Optionally involve family in your search, the way many of our members prefer.",
  },
  {
    title: "Moderated community",
    description: "Every photo is reviewed and reports are handled by a real moderation team.",
  },
];

const successStories = [
  {
    names: "Elif & Mehmet",
    location: "Istanbul → married 2025",
    quote:
      "We matched over a shared love of our hometown and met in person at an Istanbul mixer a month later.",
  },
  {
    names: "Zeynep & Kaan",
    location: "Berlin, Germany",
    quote:
      "As two Turkish-Germans, it was hard to meet people who understood both sides of our identity. This platform made it easy.",
  },
  {
    names: "Fatma & Emre",
    location: "Ankara",
    quote:
      "Our families connected early on, which made the whole process feel comfortable and natural.",
  },
];

export default function Home() {
  const upcomingEvents = getUpcomingEvents().slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-black/10 bg-gradient-to-b from-rose-50 to-[var(--background)] dark:from-rose-950/20 dark:to-[var(--background)]">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-20 sm:py-28">
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
            For the Turkish community, at home and abroad
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            A marriage-minded community, built on trust.
          </h1>
          <p className="max-w-xl text-lg text-neutral-600 dark:text-neutral-300">
            Evlilik Yolu helps Turkish singles build verified profiles, connect with serious intent,
            and meet the community in person — with family involvement always optional, never required.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
            >
              Create your profile
            </Link>
            <Link
              href="/events"
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold transition hover:border-rose-700 hover:text-rose-700 dark:border-neutral-700"
            >
              See upcoming events
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-700">How it works</h2>
        <p className="mt-2 max-w-xl text-2xl font-semibold tracking-tight">
          Three steps, built around marriage — not messaging for its own sake.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-700 text-sm font-semibold text-white">
                {i + 1}
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & safety */}
      <section className="border-y border-black/10 bg-neutral-50 dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
            Trust &amp; safety
          </h2>
          <p className="mt-2 max-w-xl text-2xl font-semibold tracking-tight">
            Built to feel safe for you and your family.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point) => (
              <div key={point.title}>
                <h3 className="font-semibold">{point.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming events teaser */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
              Meet the community
            </h2>
            <p className="mt-2 max-w-xl text-2xl font-semibold tracking-tight">
              Upcoming events near you.
            </p>
          </div>
          <Link href="/events" className="text-sm font-semibold text-rose-700 hover:underline">
            View all events →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {upcomingEvents.map((event) => (
            <Link
              key={event.slug}
              href={`/events/${event.slug}`}
              className="rounded-2xl border border-black/10 p-6 transition hover:border-rose-700 hover:shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                {event.city}
              </p>
              <h3 className="mt-2 font-semibold">{event.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {formatEventDate(event.startsAt)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Success stories */}
      <section id="success-stories" className="border-t border-black/10 bg-neutral-50 dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
            Success stories
          </h2>
          <p className="mt-2 max-w-xl text-2xl font-semibold tracking-tight">
            Real members, real marriages.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {successStories.map((story) => (
              <figure
                key={story.names}
                className="rounded-2xl border border-black/10 bg-[var(--background)] p-6"
              >
                <blockquote className="text-sm text-neutral-700 dark:text-neutral-300">
                  “{story.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm font-semibold">
                  {story.names}
                  <span className="block font-normal text-neutral-500">{story.location}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to start your search with intention?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600 dark:text-neutral-400">
          Join a community built around marriage, trust, and family — not endless swiping.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-block rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
        >
          Create your profile
        </Link>
      </section>
    </div>
  );
}
