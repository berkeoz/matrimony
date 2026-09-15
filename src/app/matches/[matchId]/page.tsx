import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserMatch, getMessages, markRead } from "@/lib/messaging";
import ChatThread from "@/components/ChatThread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { matchId } = await params;
  const match = await getUserMatch(matchId, session.user.id);
  if (!match) notFound();

  const messages = await getMessages(matchId);
  await markRead(matchId, session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/matches" className="text-sm font-semibold text-rose-700 hover:underline">
        ← All matches
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-black/10 bg-neutral-100 dark:bg-neutral-800">
          {match.otherPhotoUrl && (
            <Image src={match.otherPhotoUrl} alt="" fill sizes="48px" className="object-cover" />
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{match.otherName}</h1>
      </div>

      <div className="mt-6">
        <ChatThread
          matchId={matchId}
          currentUserId={session.user.id}
          initialMessages={messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            body: m.body,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
