import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const homepage = {
  id: "homepage",
  heroBadge: "For the Turkish community, at home and abroad",
  heroTitle: "A marriage-minded community, built on trust.",
  heroSubtitle:
    "Evlilik Yolu helps Turkish singles build verified profiles, connect with serious intent, and meet the community in person — with family involvement always optional, never required.",
  howItWorks: [
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
  ],
  trustPoints: [
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
  ],
  ctaTitle: "Ready to start your search with intention?",
  ctaDescription:
    "Join a community built around marriage, trust, and family — not endless swiping.",
};

const successStories = [
  {
    names: "Elif & Mehmet",
    location: "Istanbul → married 2025",
    quote:
      "We matched over a shared love of our hometown and met in person at an Istanbul mixer a month later.",
    order: 0,
  },
  {
    names: "Zeynep & Kaan",
    location: "Berlin, Germany",
    quote:
      "As two Turkish-Germans, it was hard to meet people who understood both sides of our identity. This platform made it easy.",
    order: 1,
  },
  {
    names: "Fatma & Emre",
    location: "Ankara",
    quote: "Our families connected early on, which made the whole process feel comfortable and natural.",
    order: 2,
  },
];

const events = [
  {
    slug: "istanbul-autumn-mixer",
    title: "Istanbul Autumn Mixer",
    description:
      "An evening meetup for members in and around Istanbul to connect in person over tea and conversation.",
    longDescription:
      "Join us for a relaxed evening mixer in Beşiktaş. This is a chance to meet other verified members of the community face to face in a comfortable, respectful setting. Light refreshments will be served. Organized in partnership with a verified local community organizer.",
    city: "Istanbul",
    venue: "Kültür Sanat Evi, Beşiktaş",
    startsAt: new Date(Date.UTC(2026, 9, 4, 18, 0)),
    organizer: "Istanbul Community Circle",
    capacity: 40,
  },
  {
    slug: "ankara-family-brunch",
    title: "Ankara Family Brunch",
    description: "A daytime family-friendly brunch for members and their families to meet in a welcoming setting.",
    longDescription:
      "A daytime brunch event designed for members who want family involvement in the process. Parents and siblings are welcome to attend alongside members. Hosted at a private venue with a set brunch menu.",
    city: "Ankara",
    venue: "Çankaya Sosyal Tesisleri",
    startsAt: new Date(Date.UTC(2026, 9, 18, 11, 0)),
    organizer: "Ankara Aile Buluşmaları",
    capacity: 30,
  },
  {
    slug: "berlin-diaspora-evening",
    title: "Berlin Diaspora Evening",
    description: "A meetup for the Turkish community in Berlin, welcoming both long-time residents and newcomers.",
    longDescription:
      "An evening event for our Berlin-based members. Whether you grew up in Germany or moved more recently, this is a welcoming space to meet others in the community who share similar values around marriage and family.",
    city: "Berlin",
    venue: "Anatolische Kulturhalle",
    startsAt: new Date(Date.UTC(2026, 10, 1, 18, 30)),
    organizer: "Berlin Türk Toplulukları",
    capacity: 50,
  },
  {
    slug: "izmir-summer-gathering",
    title: "Izmir Summer Gathering",
    description: "A seaside gathering that brought together members from across the Aegean region.",
    longDescription:
      "Our summer gathering on the Izmir waterfront brought together members from across the Aegean region for an evening of conversation and connection.",
    city: "Izmir",
    venue: "Kordon Sahili",
    startsAt: new Date(Date.UTC(2026, 7, 9, 18, 0)),
    organizer: "Izmir Community Circle",
    capacity: 45,
  },
];

const pages = [
  {
    slug: "about",
    title: "About Evlilik Yolu",
    body: `Evlilik Yolu is a marriage-focused community platform for Turkish singles, at home and abroad.

We built this platform because finding a serious, marriage-minded partner who shares your background and values shouldn't mean settling for casual dating apps. Every member creates a verified profile, and connections are built around intention — not endless swiping.

Family involvement is always optional and always on your terms. We host in-person meetups in cities with an active community, so members can meet face to face in a comfortable, respectful setting.

Whether you grew up in Turkey or in the diaspora, we hope Evlilik Yolu helps you find someone who understands where you come from.`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    body: `Your privacy matters to us. Here's a summary of how we handle your information.

What we collect: your name, email, and password (stored securely, never in plain text) when you create an account. Once profiles launch, you'll control what background information you choose to share.

Who can see your information: your full profile is only visible to other verified members, never the public. You control what's visible before a mutual match.

Email communication: we email you for account verification, event RSVPs and reminders, and updates to events you're attending. You can unsubscribe from non-essential emails at any time.

Data deletion: you can request deletion of your account and associated data at any time by contacting us.

This is a living document and will be updated as new features (like member profiles and matching) launch.`,
  },
  {
    slug: "contact",
    title: "Contact us",
    body: "Have a question, feedback, or need help with your account? Send us a message below and we'll get back to you.",
  },
];

async function main() {
  await prisma.homepageContent.upsert({
    where: { id: "homepage" },
    create: homepage,
    update: homepage,
  });
  console.log("Seeded homepage content");

  for (const story of successStories) {
    const existing = await prisma.successStory.findFirst({ where: { names: story.names } });
    if (!existing) {
      await prisma.successStory.create({ data: story });
    }
  }
  console.log("Seeded success stories");

  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      create: event,
      update: event,
    });
  }
  console.log("Seeded events");

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      create: page,
      update: {},
    });
  }
  console.log("Seeded pages");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
