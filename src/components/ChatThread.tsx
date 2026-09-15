"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
};

const POLL_MS = 4000;

function dedupeById(messages: Message[]): Message[] {
  const seen = new Map<string, Message>();
  for (const m of messages) seen.set(m.id, m);
  return Array.from(seen.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export default function ChatThread({
  matchId,
  currentUserId,
  initialMessages,
  canSend,
}: {
  matchId: string;
  currentUserId: string;
  initialMessages: Message[];
  canSend: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(initialMessages.length);

  const scrollToBottom = useCallback((smooth: boolean) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/matches/${matchId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages((prev) => dedupeById([...prev, ...data.messages]));
      if (data.messages.length > lastCountRef.current) {
        lastCountRef.current = data.messages.length;
        scrollToBottom(true);
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [matchId, scrollToBottom]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;

    setSending(true);
    setError(null);
    const res = await fetch(`/api/matches/${matchId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to send.");
      return;
    }

    setMessages((prev) => dedupeById([...prev, data.message]));
    lastCountRef.current += 1;
    setText("");
    scrollToBottom(true);
  }

  return (
    <div className="flex h-[65vh] flex-col rounded-2xl border border-black/10">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            Say hello — this is the start of your conversation.
          </p>
        ) : (
          messages.map((m, i) => {
            const mine = m.senderId === currentUserId;
            const isLastMine = mine && !messages.slice(i + 1).some((later) => later.senderId === currentUserId);
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "bg-rose-700 text-white"
                      : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-rose-100" : "text-neutral-400"}`}>
                    {new Date(m.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {isLastMine && m.readAt && " · Seen"}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {canSend ? (
        <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-black/10 p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            rows={1}
            placeholder="Type a message…"
            className="flex-1 resize-none rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-rose-700 dark:border-white/15"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      ) : (
        <p className="border-t border-black/10 p-3 text-xs text-neutral-500">
          You&apos;ve reached the free messaging limit (2 conversations).{" "}
          <Link href="/subscribe" className="font-semibold text-rose-700 hover:underline">
            Subscribe
          </Link>{" "}
          to message more people — you can still read this conversation.
        </p>
      )}
      {error && <p className="px-3 pb-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
