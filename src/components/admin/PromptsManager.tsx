"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Prompt = {
  id: string;
  text: string;
  order: number;
  active: boolean;
};

const emptyForm = { text: "", order: 0, active: true };

function PromptForm({
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
      ? `/api/admin/prompts/${(initial as typeof emptyForm & { id: string }).id}`
      : "/api/admin/prompts";
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
      <div>
        <label className="block text-xs font-medium">Prompt text</label>
        <input
          required
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          placeholder="e.g. My simple pleasures are…"
          className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </div>
      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs font-medium">Order</label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
            className="mt-1 w-24 rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
          />
        </div>
        <label className="flex items-center gap-2 pb-1.5 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Active
        </label>
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

function PromptRow({ prompt, onChanged }: { prompt: Prompt; onChanged: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete this prompt? Any member answers to it will be removed too.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/prompts/${prompt.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  if (editing) {
    return (
      <PromptForm
        initial={prompt}
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
          {prompt.text}{" "}
          {!prompt.active && (
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              INACTIVE
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-neutral-400">Order: {prompt.order}</p>
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

export default function PromptsManager({ prompts }: { prompts: Prompt[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  return (
    <div className="mt-6 space-y-4">
      {prompts.map((prompt) => (
        <PromptRow key={prompt.id} prompt={prompt} onChanged={() => router.refresh()} />
      ))}

      {adding ? (
        <PromptForm
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
          + Add prompt
        </button>
      )}
    </div>
  );
}
