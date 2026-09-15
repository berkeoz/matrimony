import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getReceivedLikes, getReceivedLikesCount } from "@/lib/matching";
import { hasActiveSubscription } from "@/lib/subscription";

export default async function LikesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const subscribed = await hasActiveSubscription(session.user.id);

  const [count, likes] = await Promise.all([
    getReceivedLikesCount(session.user.id),
    subscribed ? getReceivedLikes(session.user.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Received likes</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        People who&apos;ve expressed interest in you. Like them back and it&apos;s a match.
      </p>

      {!subscribed ? (
        <div className="mt-8 rounded-2xl border border-black/10 p-8 text-center">
          {count === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              No one has liked you yet — keep your profile up to date and check back.
            </p>
          ) : (
            <>
              <p className="text-2xl font-semibold">
                {count} {count === 1 ? "person has" : "people have"} liked you
              </p>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Subscribe to see who they are and message them right away.
              </p>
              <Link
                href="/subscribe"
                className="mt-4 inline-block rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
              >
                Subscribe to see who liked you
              </Link>
            </>
          )}
        </div>
      ) : likes.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          No one has liked you yet — keep your profile up to date and check back.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {likes.map((like) => (
            <Link
              key={like.userId}
              href={`/browse/${like.userId}`}
              className="rounded-2xl border border-black/10 p-4 transition hover:border-rose-700"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-black/10 bg-neutral-100 dark:bg-neutral-800">
                {like.photoUrl && (
                  <Image src={like.photoUrl} alt="" fill sizes="300px" className="object-cover" />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold">
                {like.name}
                {like.age !== null && <span className="font-normal text-neutral-500">, {like.age}</span>}
              </p>
              <p className="text-xs text-neutral-500">
                {[like.city, like.memleket].filter(Boolean).join(" · ")}
              </p>
              {like.profession && <p className="text-xs text-neutral-500">{like.profession}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
