import { prisma } from "@/lib/prisma";
import { toDateTimeLocalValue } from "@/lib/datetime";
import EventsManager from "@/components/admin/EventsManager";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({ orderBy: { startsAt: "desc" } });

  const items = events.map((event) => ({
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
    rsvpCount: event.rsvpCount,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Create, edit, and remove events shown on the public Events page.
      </p>
      <EventsManager events={items} />
    </div>
  );
}
