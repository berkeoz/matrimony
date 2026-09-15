import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMatches } from "@/lib/matching";

export default async function MatchesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const matches = await getMatches(session.user.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Your matches</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        People you and you both expressed interest in.
      </p>

      {matches.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-black/10 p-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">No matches yet.</p>
          <Link
            href="/browse"
            className="mt-4 inline-block rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
          >
            Browse members
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <div key={match.userId} className="rounded-2xl border border-black/10 p-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-black/10 bg-neutral-100 dark:bg-neutral-800">
                {match.photoUrl && (
                  <Image src={match.photoUrl} alt="" fill sizes="300px" className="object-cover" />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold">
                {match.name}
                {match.age !== null && <span className="font-normal text-neutral-500">, {match.age}</span>}
              </p>
              {match.city && <p className="text-xs text-neutral-500">{match.city}</p>}
              <button
                type="button"
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-400 dark:border-neutral-700"
              >
                Messaging coming soon
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
