"use client";

import { useState } from "react";
import Link from "next/link";
import TurnstileWidget from "@/components/TurnstileWidget";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, turnstileToken }),
    });
    setBusy(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          If an account exists for {email}, we&apos;ve sent a link to reset your password. It
          expires in 1 hour.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-rose-700 hover:underline">
          ← Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Forgot your password?</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-rose-700 dark:border-white/15"
          />
        </div>

        <TurnstileWidget onVerify={setTurnstileToken} />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/login" className="font-semibold text-rose-700 hover:underline">
          ← Back to login
        </Link>
      </p>
    </div>
  );
}
