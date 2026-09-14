"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HomepageContentData, HomepageSection } from "@/lib/homepage-content";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15";

function SectionListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: HomepageSection[];
  onChange: (items: HomepageSection[]) => void;
}) {
  function update(index: number, patch: Partial<HomepageSection>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...items, { title: "", description: "" }]);
  }

  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-2 space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-black/10 p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input
                  required
                  placeholder="Title"
                  value={item.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  className={inputClass}
                />
                <textarea
                  required
                  rows={2}
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-1 text-xs font-semibold text-red-700 hover:underline dark:text-red-400"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 text-xs font-semibold text-rose-700 hover:underline"
      >
        + Add item
      </button>
    </div>
  );
}

export default function HomepageManager({ content }: { content: HomepageContentData }) {
  const router = useRouter();
  const [form, setForm] = useState(content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/admin/homepage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-8">
      <div className="space-y-3 rounded-2xl border border-black/10 p-4">
        <p className="text-sm font-semibold">Hero section</p>
        <div>
          <label className="block text-xs font-medium">Badge text</label>
          <input
            required
            value={form.heroBadge}
            onChange={(e) => setForm({ ...form, heroBadge: e.target.value })}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Title</label>
          <input
            required
            value={form.heroTitle}
            onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Subtitle</label>
          <textarea
            required
            rows={2}
            value={form.heroSubtitle}
            onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 p-4">
        <SectionListEditor
          label="How it works steps"
          items={form.howItWorks}
          onChange={(items) => setForm({ ...form, howItWorks: items })}
        />
      </div>

      <div className="rounded-2xl border border-black/10 p-4">
        <SectionListEditor
          label="Trust & safety points"
          items={form.trustPoints}
          onChange={(items) => setForm({ ...form, trustPoints: items })}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-black/10 p-4">
        <p className="text-sm font-semibold">Final call to action</p>
        <div>
          <label className="block text-xs font-medium">Title</label>
          <input
            required
            value={form.ctaTitle}
            onChange={(e) => setForm({ ...form, ctaTitle: e.target.value })}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Description</label>
          <textarea
            required
            rows={2}
            value={form.ctaDescription}
            onChange={(e) => setForm({ ...form, ctaDescription: e.target.value })}
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-rose-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-sm text-green-700 dark:text-green-400">Saved.</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
