import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDateTimeLocalValue } from "@/lib/datetime";
import { getConfirmedCount, getAttendees } from "@/lib/rsvp";
import OrganizerEventsManager from "@/components/organizer/OrganizerEventsManager";

export default async function OrganizerEventsPage() {
  const session = await auth();
  const events = await prisma.event.findMany({
    where: { organizerId: session!.user.id },
    orderBy: { startsAt: "desc" },
  });

  const items = await Promise.all(
    events.map(async (event) => {
      const [confirmedCount, attendees] = await Promise.all([
        getConfirmedCount(event.id),
        getAttendees(event.id),
      ]);

      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        description: event.description,
        longDescription: event.longDescription,
        format: event.format,
        city: event.city,
        venue: event.venue,
        startsAt: toDateTimeLocalValue(event.startsAt),
        organizer: event.organizer,
        capacity: event.capacity,
        status: event.status,
        reviewStatus: event.reviewStatus,
        confirmedCount,
        attendees,
      };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Your events</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Create and manage your own events. They&apos;re always free, and need admin approval
        before showing up on the public Events page. You can view and remove your own attendees
        any time.
      </p>
      <OrganizerEventsManager events={items} />
    </div>
  );
}
