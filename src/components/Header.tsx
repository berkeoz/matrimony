import Link from "next/link";
import type { Session } from "next-auth";
import SignOutButton from "@/components/SignOutButton";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/#success-stories", label: "Success Stories" },
];

export default function Header({ session }: { session: Session | null }) {
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
            <Link key={link.href} href={link.href} className="transition hover:text-rose-700">
              {link.label}
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
