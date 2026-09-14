import Link from "next/link";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const success = status === "success";

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      {success ? (
        <>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
            Email verified
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">You&apos;re all set</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Your email has been verified. Thanks for confirming your account.
          </p>
        </>
      ) : (
        <>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
            Link expired or invalid
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            We couldn&apos;t verify that link
          </h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            The verification link may have expired or already been used. Log in and request a
            new one from your account.
          </p>
        </>
      )}
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-rose-700 hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
