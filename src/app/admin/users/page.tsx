import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {users.length} account{users.length === 1 ? "" : "s"}. Profile management coming once the
        profile section is built.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Verified</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3">{user.name ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      user.role === "ADMIN"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                        : user.role === "ORGANIZER"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.emailVerified ? (
                    <span className="text-green-700 dark:text-green-400">Yes</span>
                  ) : (
                    <span className="text-neutral-400">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {user.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
