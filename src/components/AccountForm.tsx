"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-rose-700 dark:border-white/15";

export default function AccountForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const emailChanging = email.trim().toLowerCase() !== initialEmail.toLowerCase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: emailChanging ? email : undefined,
        currentPassword: emailChanging ? currentPassword : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save.");
      return;
    }

    setCurrentPassword("");
    setMessage(
      data.emailChanged
        ? "Saved. Check your new email address for a verification link."
        : "Saved."
    );
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-black/10 p-4">
      <p className="text-sm font-semibold">Account</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {emailChanging && (
        <div className="mt-4">
          <label className="block text-sm font-medium">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            placeholder="Required to change your email"
          />
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-rose-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save account"}
        </button>
        {message && <span className="text-sm text-green-700 dark:text-green-400">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
