"use client";

import { useState } from "react";

export default function SubscribeRequestButton({ plan }: { plan: "MONTHLY" | "YEARLY" }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setStatus("sending");
    setError(null);
    const res = await fetch("/api/subscribe-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setError(data.error ?? "Failed to send request.");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="rounded-full bg-green-100 px-4 py-2 text-center text-sm font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
        Request sent — we&apos;ll be in touch
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRequest}
        disabled={status === "sending"}
        className="w-full rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : `Request ${plan === "MONTHLY" ? "Monthly" : "Yearly"}`}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
