import { prisma } from "@/lib/prisma";
import { events } from "@/lib/events";

export default async function AdminOverviewPage() {
  const [totalUsers, verifiedUsers, adminCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  const stats = [
    { label: "Total users", value: totalUsers },
    { label: "Verified users", value: verifiedUsers },
    { label: "Admins", value: adminCount },
    { label: "Events listed", value: events.length },
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
