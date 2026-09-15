"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "MEMBER" | "ORGANIZER" | "ADMIN";
type Plan = "MONTHLY" | "YEARLY";

type Subscription = {
  plan: Plan;
  status: "ACTIVE" | "CANCELLED";
  isActive: boolean;
  expiresAt: string;
} | null;

export default function UserRow({
  id,
  name,
  email,
  role,
  emailVerified,
  subscription,
  createdAt,
  isSelf,
}: {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  emailVerified: boolean;
  subscription: Subscription;
  createdAt: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGrant(plan: Plan) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant", plan }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to grant subscription.");
      return;
    }
    router.refresh();
  }

  async function handleCancelSubscription() {
    if (!confirm(`Cancel ${email}'s subscription?`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to cancel subscription.");
      return;
    }
    router.refresh();
  }

  async function handleRoleChange(newRole: Role) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update role.");
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete ${email}? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete user.");
      return;
    }
    router.refresh();
  }

  return (
    <tr className="border-b border-black/5 last:border-0">
      <td className="px-4 py-3">{name ?? "—"}</td>
      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{email}</td>
      <td className="px-4 py-3">
        <select
          value={role}
          disabled={busy || isSelf}
          onChange={(e) => handleRoleChange(e.target.value as Role)}
          className="rounded-lg border border-black/15 bg-transparent px-2 py-1 text-xs font-semibold disabled:opacity-60 dark:border-white/15"
        >
          <option value="MEMBER">MEMBER</option>
          <option value="ORGANIZER">ORGANIZER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </td>
      <td className="px-4 py-3">
        {emailVerified ? (
          <span className="text-green-700 dark:text-green-400">Yes</span>
        ) : (
          <span className="text-neutral-400">No</span>
        )}
      </td>
      <td className="px-4 py-3">
        {subscription?.isActive ? (
          <div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
              {subscription.plan === "MONTHLY" ? "Monthly" : "Yearly"} · until {subscription.expiresAt}
            </span>
            <div className="mt-1">
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={busy}
                className="text-[11px] font-semibold text-red-700 hover:underline disabled:opacity-40 dark:text-red-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-neutral-400">Free</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleGrant("MONTHLY")}
                disabled={busy}
                className="text-[11px] font-semibold text-rose-700 hover:underline disabled:opacity-40"
              >
                Grant monthly
              </button>
              <button
                type="button"
                onClick={() => handleGrant("YEARLY")}
                disabled={busy}
                className="text-[11px] font-semibold text-rose-700 hover:underline disabled:opacity-40"
              >
                Grant yearly
              </button>
            </div>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{createdAt}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy || isSelf}
          className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-40 disabled:no-underline dark:text-red-400"
        >
          Delete
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
