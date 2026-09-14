"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create user.");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("MEMBER");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800"
      >
        + Add user
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-black/10 p-4 sm:flex sm:flex-wrap sm:items-end sm:gap-3"
    >
      <div>
        <label className="block text-xs font-medium">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15 sm:w-40"
        />
      </div>
      <div>
        <label className="block text-xs font-medium">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15 sm:w-52"
        />
      </div>
      <div>
        <label className="block text-xs font-medium">Password</label>
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15 sm:w-40"
        />
      </div>
      <div>
        <label className="block text-xs font-medium">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-1 rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        >
          <option value="MEMBER">MEMBER</option>
          <option value="ORGANIZER">ORGANIZER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <div className="mt-3 flex gap-2 sm:mt-0">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold dark:border-neutral-700"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
