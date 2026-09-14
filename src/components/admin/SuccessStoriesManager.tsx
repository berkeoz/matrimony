"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Story = {
  id: string;
  names: string;
  location: string;
  quote: string;
  order: number;
};

const emptyForm = { names: "", location: "", quote: "", order: 0 };

function StoryForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: typeof emptyForm;
  onCancel?: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = "id" in initial;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const url = isEdit
      ? `/api/admin/success-stories/${(initial as typeof emptyForm & { id: string }).id}`
      : "/api/admin/success-stories";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
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
        <div>
          <label className="block text-xs font-medium">Names</label>
          <input
            required
            value={form.names}
            onChange={(e) => setForm({ ...form, names: e.target.value })}
            className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Location</label>
          <input
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium">Quote</label>
        <textarea
          required
          rows={2}
          value={form.quote}
          onChange={(e) => setForm({ ...form, quote: e.target.value })}
          className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </div>
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-xs font-medium">Order</label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
            className="mt-1 w-24 rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
          />
        </div>
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

function StoryRow({ story, onChanged }: { story: Story; onChanged: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete the story for ${story.names}?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/success-stories/${story.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    }
  }

  if (editing) {
    return (
      <StoryForm
        initial={story}
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
          {story.names} <span className="font-normal text-neutral-500">— {story.location}</span>
        </p>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">“{story.quote}”</p>
        <p className="mt-1 text-xs text-neutral-400">Order: {story.order}</p>
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

export default function SuccessStoriesManager({ stories }: { stories: Story[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  return (
    <div className="mt-6 space-y-4">
      {stories.map((story) => (
        <StoryRow key={story.id} story={story} onChanged={() => router.refresh()} />
      ))}

      {adding ? (
        <StoryForm
          initial={emptyForm}
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
          + Add success story
        </button>
      )}
    </div>
  );
}
