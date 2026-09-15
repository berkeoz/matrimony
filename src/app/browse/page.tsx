import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile, isProfileComplete } from "@/lib/profile";
import BrowseClient from "@/components/BrowseClient";

export default async function BrowsePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const profile = await getProfile(session.user.id);
  const complete = isProfileComplete(profile);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Browse members</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Members looking for the same thing you are. Express interest, and if it&apos;s mutual,
        it&apos;s a match.
      </p>

      {complete ? (
        <div className="mt-8">
          <BrowseClient />
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-black/10 p-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Complete your profile to start browsing members.
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-block rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
          >
            Complete your profile
          </Link>
        </div>
      )}
    </div>
  );
}
