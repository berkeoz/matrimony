"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PromptOption = { id: string; text: string };
type Answer = { promptId: string; prompt: string; answer: string };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-rose-700 dark:border-white/15";

function AnswerCard({
  answer,
  onSaved,
}: {
  answer: Answer;
  onSaved: () => void;
}) {
  const [text, setText] = useState(answer.answer);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/profile/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId: answer.promptId, answer: text }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save.");
      return;
    }
    onSaved();
  }

  async function handleRemove() {
    setBusy(true);
    await fetch(`/api/profile/prompts/${answer.promptId}`, { method: "DELETE" });
    setBusy(false);
    onSaved();
  }

  const changed = text !== answer.answer;

  return (
    <div className="rounded-xl border border-black/10 p-3">
      <p className="text-sm font-medium">{answer.prompt}</p>
      <textarea
        rows={2}
        maxLength={300}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={inputClass}
      />
      <div className="mt-2 flex items-center gap-3">
        {changed && (
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !text.trim()}
            className="rounded-full bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-800 disabled:opacity-50"
          >
            Save
          </button>
        )}
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-40 dark:text-red-400"
        >
          Remove
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}

function AddPromptCard({
  options,
  onSaved,
  onCancel,
}: {
  options: PromptOption[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [promptId, setPromptId] = useState(options[0]?.id ?? "");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!promptId || !text.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/profile/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId, answer: text }),
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
    <div className="rounded-xl border border-dashed border-black/15 p-3 dark:border-white/15">
      <label className="block text-xs font-medium">Prompt</label>
      <select value={promptId} onChange={(e) => setPromptId(e.target.value)} className={inputClass}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.text}
          </option>
        ))}
      </select>
      <label className="mt-2 block text-xs font-medium">Your answer</label>
      <textarea
        rows={2}
        maxLength={300}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={inputClass}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || !text.trim()}
          className="rounded-full bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-800 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-neutral-500 hover:underline"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}

export default function ProfilePromptsManager({
  activePrompts,
  answers,
  maxAnswers,
}: {
  activePrompts: PromptOption[];
  answers: Answer[];
  maxAnswers: number;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const answeredIds = new Set(answers.map((a) => a.promptId));
  const availableOptions = activePrompts.filter((p) => !answeredIds.has(p.id));

  return (
    <div className="rounded-2xl border border-black/10 p-4">
      <p className="text-sm font-semibold">
        Prompts <span className="font-normal text-neutral-500">({answers.length} / {maxAnswers})</span>
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        Pick up to {maxAnswers} — shown on your profile to subscribers.
      </p>

      <div className="mt-3 space-y-3">
        {answers.map((a) => (
          <AnswerCard key={a.promptId} answer={a} onSaved={() => router.refresh()} />
        ))}

        {adding ? (
          <AddPromptCard
            options={availableOptions}
            onSaved={() => {
              setAdding(false);
              router.refresh();
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          answers.length < maxAnswers &&
          availableOptions.length > 0 && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold transition hover:border-rose-700 dark:border-neutral-700"
            >
              + Add a prompt
            </button>
          )
        )}
      </div>
    </div>
  );
}
