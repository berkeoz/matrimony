import { getAuditLog } from "@/lib/audit";

const actionLabels: Record<string, string> = {
  "user.create": "Created user",
  "user.update": "Updated user",
  "user.delete": "Deleted user",
  "subscription.grant": "Granted subscription",
  "subscription.cancel": "Cancelled subscription",
  "event.create": "Created event",
  "event.update": "Updated event",
  "event.delete": "Deleted event",
  "event.approve": "Approved event",
  "event.reject": "Rejected event",
  "event.attendee.remove": "Removed attendee",
  "success-story.create": "Created success story",
  "success-story.update": "Updated success story",
  "success-story.delete": "Deleted success story",
  "homepage.update": "Updated homepage content",
  "page.update": "Updated page content",
};

function formatMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const entries = Object.entries(metadata as Record<string, unknown>);
  if (entries.length === 0) return null;
  return entries.map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ");
}

export default async function AdminAuditLogPage() {
  const entries = await getAuditLog(200);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        The most recent {entries.length} admin actions, newest first.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Who</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  No admin actions logged yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-b border-black/5 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                    {e.createdAt.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">{e.actorName ?? e.actorEmail ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{actionLabels[e.action] ?? e.action}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatMetadata(e.metadata) ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
