"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type RsvpState = "NONE" | "CONFIRMED" | "WAITLISTED";

export default function RsvpButton({
  slug,
  initialStatus,
  isLoggedIn,
  spotsLeft,
}: {
  slug: string;
  initialStatus: RsvpState;
  isLoggedIn: boolean;
  spotsLeft: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<RsvpState>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <>
        <Link
          href="/signup"
          className="inline-block rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
        >
          {spotsLeft <= 0 ? "Join waitlist" : "RSVP to this event"}
        </Link>
        <p className="mt-3 text-xs text-neutral-500">You&apos;ll need an account to RSVP.</p>
      </>
    );
  }

  async function handleRsvp() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/events/${slug}/rsvp`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to RSVP.");
      return;
    }
    setStatus(data.status);
    router.refresh();
  }

  async function handleCancel() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/events/${slug}/rsvp`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Failed to cancel.");
      return;
    }
    setStatus("NONE");
    router.refresh();
  }

  if (status === "CONFIRMED" || status === "WAITLISTED") {
    return (
      <div>
        <p
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            status === "CONFIRMED"
              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
          }`}
        >
          {status === "CONFIRMED" ? "You're going ✓" : "You're on the waitlist"}
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-50 dark:text-red-400"
          >
            {busy ? "Cancelling…" : status === "CONFIRMED" ? "Cancel RSVP" : "Leave waitlist"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRsvp}
        disabled={busy}
        className="rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
      >
        {busy ? "Submitting…" : spotsLeft <= 0 ? "Join waitlist" : "RSVP to this event"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
