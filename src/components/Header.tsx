import Link from "next/link";
import type { Session } from "next-auth";
import SignOutButton from "@/components/SignOutButton";

const publicNavLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/#success-stories", label: "Success Stories" },
];

const memberNavLinks = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/likes", label: "Likes" },
  { href: "/matches", label: "Matches" },
  { href: "/events", label: "Events" },
  { href: "/subscribe", label: "Subscribe" },
];

export default function Header({
  session,
  unreadCount = 0,
  likesCount = 0,
}: {
  session: Session | null;
  unreadCount?: number;
  likesCount?: number;
}) {
  const navLinks = session?.user ? memberNavLinks : publicNavLinks;
  const badgeCounts: Record<string, number> = { "/matches": unreadCount, "/likes": likesCount };

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-700 text-sm font-semibold text-white">
            E
          </span>
          <span className="text-lg font-semibold tracking-tight">Evlilik Yolu</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 sm:flex dark:text-neutral-300">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative transition hover:text-rose-700"
            >
              {link.label}
              {badgeCounts[link.href] > 0 && (
                <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-700 px-1 text-[10px] font-semibold text-white">
                  {badgeCounts[link.href]}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {session?.user ? (
          <div className="flex items-center gap-4">
            {session.user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden text-sm font-semibold text-rose-700 hover:underline sm:block"
              >
                Admin
              </Link>
            )}
            {session.user.role === "ORGANIZER" && (
              <Link
                href="/organizer/events"
                className="hidden text-sm font-semibold text-rose-700 hover:underline sm:block"
              >
                Organize
              </Link>
            )}
            <Link
              href="/profile"
              className="hidden text-sm font-medium text-neutral-600 transition hover:text-rose-700 sm:block dark:text-neutral-300"
            >
              {session.user.name ?? session.user.email}
            </Link>
            <SignOutButton className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold transition hover:border-rose-700 hover:text-rose-700 dark:border-neutral-700" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-neutral-600 transition hover:text-rose-700 sm:block dark:text-neutral-300"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
