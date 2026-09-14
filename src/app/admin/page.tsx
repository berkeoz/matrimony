import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const [totalUsers, verifiedUsers, adminCount, eventCount, storyCount, rsvpCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: { not: null } } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.event.count(),
      prisma.successStory.count(),
      prisma.eventRsvp.count({ where: { status: { in: ["CONFIRMED", "WAITLISTED"] } } }),
    ]);

  const stats = [
    { label: "Total users", value: totalUsers },
    { label: "Verified users", value: verifiedUsers },
    { label: "Admins", value: adminCount },
    { label: "Events listed", value: eventCount },
    { label: "Success stories", value: storyCount },
    { label: "Event RSVPs", value: rsvpCount },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Manage the site&apos;s content and members.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-black/10 p-5">
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
