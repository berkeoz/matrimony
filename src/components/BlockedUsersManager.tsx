"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

type BlockedUser = { userId: string; name: string; photoUrl: string | null };

export default function BlockedUsersManager({ users }: { users: BlockedUser[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleUnblock(userId: string) {
    setBusyId(userId);
    const res = await fetch(`/api/block/${userId}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) router.refresh();
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 p-4">
        <p className="text-sm font-semibold">Blocked users</p>
        <p className="mt-1 text-sm text-neutral-500">You haven&apos;t blocked anyone.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/10 p-4">
      <p className="text-sm font-semibold">Blocked users</p>
      <ul className="mt-3 space-y-2">
        {users.map((u) => (
          <li key={u.userId} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-black/10 bg-neutral-100 dark:bg-neutral-800">
                {u.photoUrl && <Image src={u.photoUrl} alt="" fill sizes="36px" className="object-cover" />}
              </div>
              <p className="truncate font-medium">{u.name}</p>
            </div>
            <button
              type="button"
              onClick={() => handleUnblock(u.userId)}
              disabled={busyId === u.userId}
              className="shrink-0 text-xs font-semibold text-rose-700 hover:underline disabled:opacity-40"
            >
              Unblock
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
