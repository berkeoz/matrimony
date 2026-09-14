"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { slugify } from "@/lib/events";
import { toDateTimeLocalValue, formatWallClockDate, parseWallClockDateTime } from "@/lib/datetime";

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
  rsvpCount: number;
};

const emptyForm: Omit<EventItem, "id"> = {
  slug: "",
  title: "",
  description: "",
  longDescription: "",
  city: "",
  venue: "",
  startsAt: "",
  organizer: "",
  capacity: 0,
  rsvpCount: 0,
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15";

function EventForm({
  initial,
  eventId,
  onCancel,
  onSaved,
}: {
  initial: Omit<EventItem, "id">;
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
              setForm((f) => ({
                ...f,
                title,
                slug: slugTouched ? f.slug : slugify(title),
              }));
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
        <Field label="Current RSVPs">
          <input
            required
            type="number"
            min={0}
            value={form.rsvpCount}
            onChange={(e) => setForm({ ...form, rsvpCount: Number(e.target.value) })}
            className={inputClass}
          />
        </Field>
      </div>

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

function EventRow({ event, onChanged }: { event: EventItem; onChanged: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${event.title}"?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/events/${event.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  if (editing) {
    const { id, ...rest } = event;
    return (
      <EventForm
        initial={rest}
        eventId={id}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          onChanged();
        }}
      />
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-black/10 p-4">
      <div>
        <p className="text-sm font-semibold">
          {event.title} <span className="font-normal text-neutral-500">— {event.city}</span>
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {formatWallClockDate(parseWallClockDateTime(event.startsAt))} · {event.venue}
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          {event.rsvpCount} / {event.capacity} RSVP&apos;d · /events/{event.slug}
        </p>
      </div>
      <div className="flex shrink-0 gap-3">
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
