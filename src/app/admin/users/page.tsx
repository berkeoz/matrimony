import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import UserRow from "@/components/admin/UserRow";
import CreateUserForm from "@/components/admin/CreateUserForm";

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true, expiresAt: true } },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {users.length} account{users.length === 1 ? "" : "s"}. Profile management coming once
            the profile section is built.
          </p>
        </div>
        <CreateUserForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Verified</th>
              <th className="px-4 py-3 font-semibold">Subscription</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                id={user.id}
                name={user.name}
                email={user.email}
                role={user.role}
                emailVerified={Boolean(user.emailVerified)}
                subscription={
                  user.subscription
                    ? {
                        plan: user.subscription.plan,
                        status: user.subscription.status,
                        isActive:
                          user.subscription.status === "ACTIVE" &&
                          user.subscription.expiresAt > new Date(),
                        expiresAt: user.subscription.expiresAt.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }),
                      }
                    : null
                }
                createdAt={user.createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                isSelf={user.id === session?.user.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
