"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { slugify } from "@/lib/events";
import { toDateTimeLocalValue, formatWallClockDate, parseWallClockDateTime } from "@/lib/datetime";

type EventStatus = "OPEN" | "CLOSED" | "CANCELLED" | "COMPLETED";
type RsvpStatus = "CONFIRMED" | "WAITLISTED" | "CANCELLED";

type Attendee = {
  userId: string;
  name: string | null;
  email: string;
  status: RsvpStatus;
};

type EventItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  city: string;
  venue: string;
  startsAt: string; // datetime-local value
  organizer: string;
  capacity: number;
  status: EventStatus;
  confirmedCount: number;
  attendees: Attendee[];
};

type FormFields = Omit<EventItem, "id" | "confirmedCount" | "attendees">;

const emptyForm: FormFields = {
  slug: "",
  title: "",
  description: "",
  longDescription: "",
  city: "",
  venue: "",
  startsAt: "",
  organizer: "",
  capacity: 0,
  status: "OPEN",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15";

const statusBadgeClass: Record<EventStatus, string> = {
  OPEN: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  CLOSED: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

function EventForm({
  initial,
  eventId,
  onCancel,
  onSaved,
}: {
  initial: FormFields;
  eventId?: string;
  onCancel?: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(eventId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const url = eventId ? `/api/admin/events/${eventId}` : "/api/admin/events";
    const res = await fetch(url, {
      method: eventId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save.");
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-black/10 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title">
          <input
            required
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
            }}
            className={inputClass}
          />
        </Field>
        <Field label="Slug">
          <input
            required
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm({ ...form, slug: e.target.value });
            }}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Short description (shown in event cards)">
        <textarea
          required
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputClass}
        />
      </Field>

      <Field label="Full description">
        <textarea
          required
          rows={3}
          value={form.longDescription}
          onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City">
          <input
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Venue">
          <input
            required
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date & time (local to the event's city)">
          <input
            required
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Organizer">
          <input
            required
            value={form.organizer}
            onChange={(e) => setForm({ ...form, organizer: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Capacity">
          <input
            required
            type="number"
            min={0}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
            className={inputClass}
          >
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed (RSVPs paused)</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </Field>
      </div>
      {eventId && form.status === "CANCELLED" && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Saving will email everyone currently RSVP&apos;d that this event is cancelled.
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold dark:border-neutral-700"
          >
            Cancel
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}

function AttendeeList({ eventId, attendees, onChanged }: { eventId: string; attendees: Attendee[]; onChanged: () => void }) {
  const router = useRouter();
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function handleRemove(userId: string) {
    if (!confirm("Remove this attendee's RSVP?")) return;
    setBusyUserId(userId);
    const res = await fetch(`/api/admin/events/${eventId}/attendees/${userId}`, { method: "DELETE" });
    setBusyUserId(null);
    if (res.ok) {
      router.refresh();
      onChanged();
    }
  }

  if (attendees.length === 0) {
    return <p className="text-xs text-neutral-500">No RSVPs yet.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {attendees.map((a) => (
        <li key={a.userId} className="flex items-center justify-between gap-3 text-xs">
          <span>
            {a.name ?? a.email}{" "}
            <span className="text-neutral-400">
              — {a.email} ·{" "}
              <span className={a.status === "WAITLISTED" ? "text-amber-600" : "text-green-700"}>
                {a.status === "WAITLISTED" ? "waitlisted" : "confirmed"}
              </span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => handleRemove(a.userId)}
            disabled={busyUserId === a.userId}
            className="shrink-0 font-semibold text-red-700 hover:underline disabled:opacity-40 dark:text-red-400"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}

function EventRow({ event, onChanged }: { event: EventItem; onChanged: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${event.title}"? This removes it and all RSVPs.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/events/${event.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  if (editing) {
    const { id, confirmedCount, attendees, ...rest } = event;
    void id;
    void confirmedCount;
    void attendees;
    return (
      <EventForm
        initial={rest}
        eventId={event.id}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          onChanged();
        }}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-black/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">
              {event.title} <span className="font-normal text-neutral-500">— {event.city}</span>
            </p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass[event.status]}`}>
              {event.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {formatWallClockDate(parseWallClockDateTime(event.startsAt))} · {event.venue}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {event.confirmedCount} / {event.capacity} confirmed · /events/{event.slug}
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setShowAttendees((s) => !s)}
            className="text-xs font-semibold text-neutral-600 hover:underline dark:text-neutral-300"
          >
            {showAttendees ? "Hide" : "View"} attendees ({event.attendees.length})
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-rose-700 hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-40 dark:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
      {showAttendees && (
        <div className="mt-4 border-t border-black/10 pt-3">
          <AttendeeList eventId={event.id} attendees={event.attendees} onChanged={onChanged} />
        </div>
      )}
    </div>
  );
}

export default function EventsManager({ events }: { events: EventItem[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  return (
    <div className="mt-6 space-y-4">
      {events.map((event) => (
        <EventRow key={event.id} event={event} onChanged={() => router.refresh()} />
      ))}

      {adding ? (
        <EventForm
          initial={{ ...emptyForm, startsAt: toDateTimeLocalValue(new Date()) }}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800"
        >
          + Add event
        </button>
      )}
    </div>
  );
}
