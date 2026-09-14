import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Evlilik Yolu</p>
          <p className="mt-1 text-sm text-neutral-500">
            A marriage-focused community platform for Turkish singles, at home and abroad.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          <Link href="/events" className="hover:text-rose-700">
            Events
          </Link>
          <Link href="/#success-stories" className="hover:text-rose-700">
            Success Stories
          </Link>
          <Link href="/about" className="hover:text-rose-700">
            About
          </Link>
          <Link href="/contact" className="hover:text-rose-700">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-rose-700">
            Privacy
          </Link>
        </nav>
      </div>
      <div className="border-t border-black/5 px-6 py-4 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} Evlilik Yolu. All rights reserved.
      </div>
    </footer>
  );
}
