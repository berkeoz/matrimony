"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type BrowseCard = {
  userId: string;
  name: string;
  age: number | null;
  city: string | null;
  memleket: string | null;
  profession: string | null;
  photoUrl: string | null;
};

type InterestUsage = { used: number; limit: number; unlimited: boolean };

const EDUCATION_OPTIONS = [
  { value: "", label: "Any education" },
  { value: "HIGH_SCHOOL", label: "High school" },
  { value: "BACHELORS", label: "Bachelor's degree" },
  { value: "MASTERS", label: "Master's degree" },
  { value: "DOCTORATE", label: "Doctorate" },
  { value: "OTHER", label: "Other" },
];
const MARITAL_OPTIONS = [
  { value: "", label: "Any marital status" },
  { value: "NEVER_MARRIED", label: "Never married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];

const selectClass =
  "rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15";

type Filters = {
  city: string;
  minAge: string;
  maxAge: string;
  educationLevel: string;
  maritalStatus: string;
};

const emptyFilters: Filters = { city: "", minAge: "", maxAge: "", educationLevel: "", maritalStatus: "" };

export default function BrowseClient() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [cards, setCards] = useState<BrowseCard[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioned, setActioned] = useState<Record<string, "interested" | "matched" | "passed">>({});
  const [interestUsage, setInterestUsage] = useState<InterestUsage | null>(null);

  const load = useCallback(async (nextPage: number, activeFilters: Filters) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(nextPage) });
    if (activeFilters.city) params.set("city", activeFilters.city);
    if (activeFilters.minAge) params.set("minAge", activeFilters.minAge);
    if (activeFilters.maxAge) params.set("maxAge", activeFilters.maxAge);
    if (activeFilters.educationLevel) params.set("educationLevel", activeFilters.educationLevel);
    if (activeFilters.maritalStatus) params.set("maritalStatus", activeFilters.maritalStatus);

    const res = await fetch(`/api/browse?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to load profiles.");
      return;
    }
    setCards(data.cards);
    setHasMore(data.hasMore);
    if (data.interestUsage) setInterestUsage(data.interestUsage);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount, not derived state
    load(1, filters);
    // Intentionally run once on mount only; `load` and `filters` change
    // identity on every render but re-fetching on filter change happens via applyFilters/changePage instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load(1, filters);
  }

  function changePage(next: number) {
    setPage(next);
    load(next, filters);
  }

  async function handleInterest(userId: string) {
    const res = await fetch("/api/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: userId }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.usage) setInterestUsage(data.usage);
    if (res.ok) {
      setActioned((prev) => ({ ...prev, [userId]: data.matched ? "matched" : "interested" }));
    } else if (data.code === "FREE_LIMIT_REACHED") {
      setError(data.error);
    }
  }

  async function handlePass(userId: string) {
    const res = await fetch("/api/pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: userId }),
    });
    if (res.ok) {
      setActioned((prev) => ({ ...prev, [userId]: "passed" }));
    }
  }

  return (
    <div>
      <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/10 p-4">
        <div>
          <label className="block text-xs font-medium">City</label>
          <input
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className={`mt-1 ${selectClass}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Min age</label>
          <input
            type="number"
            min={18}
            max={100}
            value={filters.minAge}
            onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
            className={`mt-1 w-20 ${selectClass}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Max age</label>
          <input
            type="number"
            min={18}
            max={100}
            value={filters.maxAge}
            onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
            className={`mt-1 w-20 ${selectClass}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Education</label>
          <select
            value={filters.educationLevel}
            onChange={(e) => setFilters({ ...filters, educationLevel: e.target.value })}
            className={`mt-1 ${selectClass}`}
          >
            {EDUCATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium">Marital status</label>
          <select
            value={filters.maritalStatus}
            onChange={(e) => setFilters({ ...filters, maritalStatus: e.target.value })}
            className={`mt-1 ${selectClass}`}
          >
            {MARITAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800"
        >
          Apply filters
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {interestUsage && !interestUsage.unlimited && (
        <p className="mt-4 rounded-xl bg-neutral-100 px-4 py-2 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {interestUsage.used >= interestUsage.limit
            ? "You've used your 2 free interests. Subscribe to express interest in more people — passing stays unlimited."
            : `You've expressed interest in ${interestUsage.used} of ${interestUsage.limit} free profiles.`}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-neutral-500">Loading…</p>
      ) : cards.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          No members match right now — try widening your filters.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const status = actioned[card.userId];
            return (
              <div key={card.userId} className="rounded-2xl border border-black/10 p-4">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-black/10 bg-neutral-100 dark:bg-neutral-800">
                  {card.photoUrl && (
                    <Image src={card.photoUrl} alt="" fill sizes="300px" className="object-cover" />
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold">
                  {card.name}
                  {card.age !== null && <span className="font-normal text-neutral-500">, {card.age}</span>}
                </p>
                <p className="text-xs text-neutral-500">
                  {[card.city, card.memleket].filter(Boolean).join(" · ")}
                </p>
                {card.profession && <p className="text-xs text-neutral-500">{card.profession}</p>}

                {status === "matched" ? (
                  <p className="mt-3 rounded-full bg-green-100 px-3 py-1.5 text-center text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                    It&apos;s a match! 🎉
                  </p>
                ) : status === "interested" ? (
                  <p className="mt-3 rounded-full bg-neutral-100 px-3 py-1.5 text-center text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    Interest sent
                  </p>
                ) : status === "passed" ? (
                  <p className="mt-3 rounded-full bg-neutral-100 px-3 py-1.5 text-center text-xs font-semibold text-neutral-400 dark:bg-neutral-800">
                    Passed
                  </p>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleInterest(card.userId)}
                      disabled={Boolean(
                        interestUsage && !interestUsage.unlimited && interestUsage.used >= interestUsage.limit
                      )}
                      className="flex-1 rounded-full bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-800 disabled:opacity-40"
                    >
                      Express interest
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePass(card.userId)}
                      className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold transition hover:border-rose-700 dark:border-neutral-700"
                    >
                      Pass
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && (page > 1 || hasMore) && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={page <= 1}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-neutral-700"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">Page {page}</span>
          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={!hasMore}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-neutral-700"
          >
            Next
          </button>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-neutral-400">
        <Link href="/matches" className="font-semibold text-rose-700 hover:underline">
          View your matches →
        </Link>
      </p>
    </div>
  );
}
