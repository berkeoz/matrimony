import { prisma } from "@/lib/prisma";
import { toDateTimeLocalValue } from "@/lib/datetime";
import { getConfirmedCount, getAttendees } from "@/lib/rsvp";
import EventsManager from "@/components/admin/EventsManager";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({ orderBy: { startsAt: "desc" } });

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
        city: event.city,
        venue: event.venue,
        startsAt: toDateTimeLocalValue(event.startsAt),
        organizer: event.organizer,
        capacity: event.capacity,
        status: event.status,
        priceCents: event.priceCents,
        confirmedCount,
        attendees,
      };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Create, edit, and remove events shown on the public Events page. Attendees are notified
        automatically if you change the date, time, venue, or cancel an event.
      </p>
      <EventsManager events={items} />
    </div>
  );
}
