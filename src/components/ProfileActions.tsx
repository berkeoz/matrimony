"use client";

import { useState } from "react";
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

  if (status === "matched") {
    return (
      <Link
        href={`/matches/${matchId}`}
        className="block rounded-full bg-green-100 px-4 py-2.5 text-center text-sm font-semibold text-green-800 transition hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300"
      >
        It&apos;s a match! 🎉 Start chatting →
      </Link>
    );
  }

  if (status === "interested") {
    return (
      <p className="rounded-full bg-neutral-100 px-4 py-2.5 text-center text-sm font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
        Interest sent
      </p>
    );
  }

  if (status === "passed") {
    return (
      <p className="rounded-full bg-neutral-100 px-4 py-2.5 text-center text-sm font-semibold text-neutral-400 dark:bg-neutral-800">
        Passed
      </p>
    );
  }

  const atCap = !usage.unlimited && usage.used >= usage.limit;

  return (
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
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
