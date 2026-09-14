import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const adminNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/success-stories", label: "Success Stories" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:flex-row">
      <aside className="shrink-0 sm:w-48">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Admin</p>
        <nav className="mt-3 flex flex-row flex-wrap gap-1 sm:flex-col">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-rose-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
