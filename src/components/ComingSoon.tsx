import Link from "next/link";

export default function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
        Coming soon
      </span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">{description}</p>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-rose-700 hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
