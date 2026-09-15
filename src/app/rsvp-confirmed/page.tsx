import Link from "next/link";

export default async function RsvpConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; event?: string }>;
}) {
  const { status, event } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      {status === "confirmed" && (
        <>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
            RSVP confirmed
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">You&apos;re going!</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Your spot is reserved. We&apos;ll send you a reminder the day before.
          </p>
        </>
      )}
      {status === "waitlisted" && (
        <>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            On the waitlist
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">You&apos;re on the waitlist</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            This event filled up while your confirmation was pending. We&apos;ll email you right
            away if a spot opens up.
          </p>
        </>
      )}
      {status !== "confirmed" && status !== "waitlisted" && (
        <>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
            Link invalid
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            We couldn&apos;t confirm that RSVP
          </h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            This confirmation link may have expired or already been used. Visit the event page to
            RSVP again.
          </p>
        </>
      )}
      <Link
        href={event ? `/events/${event}` : "/events"}
        className="mt-6 inline-block text-sm font-semibold text-rose-700 hover:underline"
      >
        ← View event
      </Link>
    </div>
  );
}
