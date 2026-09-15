import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getConversations } from "@/lib/messaging";

export default async function MatchesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const conversations = await getConversations(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Your matches</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        People you and you both expressed interest in.
      </p>

      {conversations.length === 0 ? (
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
        <div className="mt-8 space-y-3">
          {conversations.map((c) => (
            <Link
              key={c.matchId}
              href={`/matches/${c.matchId}`}
              className="flex items-center gap-3 rounded-2xl border border-black/10 p-3 transition hover:border-rose-700"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-black/10 bg-neutral-100 dark:bg-neutral-800">
                {c.otherPhotoUrl && (
                  <Image src={c.otherPhotoUrl} alt="" fill sizes="48px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{c.otherName}</p>
                <p className="truncate text-xs text-neutral-500">
                  {c.lastMessage ?? "Say hello — start the conversation."}
                </p>
              </div>
              {c.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-700 px-1.5 text-[10px] font-semibold text-white">
                  {c.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
