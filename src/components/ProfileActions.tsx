"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Status = "none" | "interested" | "passed" | "matched";
type InterestUsage = { used: number; limit: number; unlimited: boolean };

export default function ProfileActions({
  userId,
  initialStatus,
  initialMatchId,
  interestUsage,
}: {
  userId: string;
  initialStatus: Status;
  initialMatchId?: string;
  interestUsage: InterestUsage;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [matchId, setMatchId] = useState<string | undefined>(initialMatchId);
  const [usage, setUsage] = useState(interestUsage);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleInterest() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: userId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.usage) setUsage(data.usage);
    if (res.ok) {
      setStatus(data.matched ? "matched" : "interested");
      if (data.matched) setMatchId(data.matchId);
    } else {
      setError(data.error ?? "Failed to send interest.");
    }
  }

  async function handlePass() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: userId }),
    });
    setBusy(false);
    if (res.ok) {
      setStatus("passed");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to pass.");
    }
  }

  async function handleWithdraw() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/interest", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: userId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setStatus("none");
      if (data.usage) setUsage(data.usage);
    } else {
      setError(data.error ?? "Failed to undo.");
    }
  }

  async function handleBlock() {
    if (!confirm("Block this person? They won't be able to see your profile, and you won't see theirs.")) {
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/block/${userId}`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      router.push("/browse");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to block.");
    }
  }

  const atCap = !usage.unlimited && usage.used >= usage.limit;

  let content: React.ReactNode;
  if (status === "matched") {
    content = (
      <Link
        href={`/matches/${matchId}`}
        className="block rounded-full bg-green-100 px-4 py-2.5 text-center text-sm font-semibold text-green-800 transition hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300"
      >
        It&apos;s a match! 🎉 Start chatting →
      </Link>
    );
  } else if (status === "interested") {
    content = (
      <div className="flex items-center gap-2">
        <p className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-center text-sm font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          Interest sent
        </p>
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={busy}
          className="rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-semibold transition hover:border-rose-700 disabled:opacity-40 dark:border-neutral-700"
        >
          Undo
        </button>
      </div>
    );
  } else if (status === "passed") {
    content = (
      <p className="rounded-full bg-neutral-100 px-4 py-2.5 text-center text-sm font-semibold text-neutral-400 dark:bg-neutral-800">
        Passed
      </p>
    );
  } else {
    content = (
      <div>
        {atCap && (
          <p className="mb-3 rounded-xl bg-neutral-100 px-4 py-2 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            You&apos;ve used your {usage.limit} free interests.{" "}
            <Link href="/subscribe" className="font-semibold text-rose-700 hover:underline">
              Subscribe
            </Link>{" "}
            to express interest in more people.
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleInterest}
            disabled={busy || atCap}
            className="flex-1 rounded-full bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-40"
          >
            Express interest
          </button>
          <button
            type="button"
            onClick={handlePass}
            disabled={busy}
            className="rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-semibold transition hover:border-rose-700 disabled:opacity-40 dark:border-neutral-700"
          >
            Pass
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {content}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleBlock}
        disabled={busy}
        className="mt-3 text-xs text-neutral-400 hover:text-red-600 hover:underline disabled:opacity-40"
      >
        Block this person
      </button>
    </div>
  );
}
