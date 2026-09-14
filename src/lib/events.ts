export type EventStatus = "upcoming" | "past";

export type SiteEvent = {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  city: string;
  venue: string;
  startsAt: string; // ISO date
  organizer: string;
  capacity: number;
  rsvpCount: number;
};

export const events: SiteEvent[] = [
  {
    slug: "istanbul-autumn-mixer",
    title: "Istanbul Autumn Mixer",
    description:
      "An evening meetup for members in and around Istanbul to connect in person over tea and conversation.",
    longDescription:
      "Join us for a relaxed evening mixer in Beşiktaş. This is a chance to meet other verified members of the community face to face in a comfortable, respectful setting. Light refreshments will be served. Organized in partnership with a verified local community organizer.",
    city: "Istanbul",
    venue: "Kültür Sanat Evi, Beşiktaş",
    startsAt: "2026-10-04T18:00:00+03:00",
    organizer: "Istanbul Community Circle",
    capacity: 40,
    rsvpCount: 27,
  },
  {
    slug: "ankara-family-brunch",
    title: "Ankara Family Brunch",
    description:
      "A daytime family-friendly brunch for members and their families to meet in a welcoming setting.",
    longDescription:
      "A daytime brunch event designed for members who want family involvement in the process. Parents and siblings are welcome to attend alongside members. Hosted at a private venue with a set brunch menu.",
    city: "Ankara",
    venue: "Çankaya Sosyal Tesisleri",
    startsAt: "2026-10-18T11:00:00+03:00",
    organizer: "Ankara Aile Buluşmaları",
    capacity: 30,
    rsvpCount: 12,
  },
  {
    slug: "berlin-diaspora-evening",
    title: "Berlin Diaspora Evening",
    description:
      "A meetup for the Turkish community in Berlin, welcoming both long-time residents and newcomers.",
    longDescription:
      "An evening event for our Berlin-based members. Whether you grew up in Germany or moved more recently, this is a welcoming space to meet others in the community who share similar values around marriage and family.",
    city: "Berlin",
    venue: "Anatolische Kulturhalle",
    startsAt: "2026-11-01T18:30:00+01:00",
    organizer: "Berlin Türk Toplulukları",
    capacity: 50,
    rsvpCount: 41,
  },
  {
    slug: "izmir-summer-gathering",
    title: "Izmir Summer Gathering",
    description: "A seaside gathering that brought together members from across the Aegean region.",
    longDescription:
      "Our summer gathering on the Izmir waterfront brought together members from across the Aegean region for an evening of conversation and connection.",
    city: "Izmir",
    venue: "Kordon Sahili",
    startsAt: "2026-08-09T18:00:00+03:00",
    organizer: "Izmir Community Circle",
    capacity: 45,
    rsvpCount: 45,
  },
];

export function getUpcomingEvents(): SiteEvent[] {
  const now = new Date();
  return events
    .filter((e) => new Date(e.startsAt) >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

export function getPastEvents(): SiteEvent[] {
  const now = new Date();
  return events
    .filter((e) => new Date(e.startsAt) < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
}

export function getEventBySlug(slug: string): SiteEvent | undefined {
  return events.find((e) => e.slug === slug);
}

export function formatEventDate(iso: string): string {
  // Format using the wall-clock time as written in the ISO string (the
  // event's local city time), rather than converting to the viewer's or
  // server's timezone.
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return iso;
  const [, year, month, day, hour, minute] = match;
  const asUtc = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  );
  return asUtc.toLocaleString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
