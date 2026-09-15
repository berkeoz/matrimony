"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import ProfilePhotoManager from "@/components/ProfilePhotoManager";

type Gender = "MALE" | "FEMALE";
type MaritalStatus = "NEVER_MARRIED" | "DIVORCED" | "WIDOWED";
type EducationLevel = "HIGH_SCHOOL" | "BACHELORS" | "MASTERS" | "DOCTORATE" | "OTHER";
type HabitLevel = "NO" | "YES" | "SOMETIMES";

export type ProfileFormData = {
  gender: Gender | null;
  birthDate: string | null; // "YYYY-MM-DD"
  heightCm: number | null;
  city: string | null;
  memleket: string | null;
  country: string | null;
  maritalStatus: MaritalStatus | null;
  hasChildren: boolean | null;
  educationLevel: EducationLevel | null;
  fieldOfStudy: string | null;
  profession: string | null;
  smoking: HabitLevel | null;
  alcohol: HabitLevel | null;
  aboutMe: string | null;
  lookingFor: string | null;
};

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "Man" },
  { value: "FEMALE", label: "Woman" },
];
const MARITAL_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: "NEVER_MARRIED", label: "Never married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];
const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: "HIGH_SCHOOL", label: "High school" },
  { value: "BACHELORS", label: "Bachelor's degree" },
  { value: "MASTERS", label: "Master's degree" },
  { value: "DOCTORATE", label: "Doctorate" },
  { value: "OTHER", label: "Other" },
];
const HABIT_OPTIONS: { value: HabitLevel; label: string }[] = [
  { value: "NO", label: "No" },
  { value: "YES", label: "Yes" },
  { value: "SOMETIMES", label: "Sometimes" },
];

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-rose-700 dark:border-white/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

export default function ProfileForm({
  initial,
  photos,
  completeness,
}: {
  initial: ProfileFormData;
  photos: { id: string; url: string; isPrimary: boolean }[];
  completeness: { filled: number; total: number; complete: boolean };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function update<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/profile", {
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

  async function handleDeleteAccount() {
    if (
      !confirm(
        "Delete your account permanently? This removes your profile, photos, and event RSVPs. This can't be undone."
      )
    ) {
      return;
    }
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete account.");
      setDeleting(false);
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div>
      <div className="rounded-2xl border border-black/10 p-4">
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold">
            {completeness.complete ? "Profile complete" : "Profile completeness"}
          </p>
          <p className="text-neutral-500">
            {completeness.filled} / {completeness.total}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className={`h-full rounded-full transition-all ${
              completeness.complete ? "bg-green-600" : "bg-rose-700"
            }`}
            style={{ width: `${(completeness.filled / completeness.total) * 100}%` }}
          />
        </div>
        {!completeness.complete && (
          <p className="mt-2 text-xs text-neutral-500">
            Complete every field and add at least one photo to RSVP to events.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 p-4">
        <p className="text-sm font-semibold">Photos</p>
        <div className="mt-3">
          <ProfilePhotoManager photos={photos} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <div className="grid gap-4 rounded-2xl border border-black/10 p-4 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">Basics</p>
          <Field label="Gender">
            <select
              value={form.gender ?? ""}
              onChange={(e) => update("gender", (e.target.value || null) as Gender | null)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Birth date">
            <input
              type="date"
              value={form.birthDate ?? ""}
              onChange={(e) => update("birthDate", e.target.value || null)}
              className={inputClass}
            />
          </Field>
          <Field label="Height (cm)">
            <input
              type="number"
              min={100}
              max={250}
              value={form.heightCm ?? ""}
              onChange={(e) => update("heightCm", e.target.value ? Number(e.target.value) : null)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 rounded-2xl border border-black/10 p-4 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">Background</p>
          <Field label="Current city">
            <input
              value={form.city ?? ""}
              onChange={(e) => update("city", e.target.value || null)}
              className={inputClass}
            />
          </Field>
          <Field label="Memleket (hometown)">
            <input
              value={form.memleket ?? ""}
              onChange={(e) => update("memleket", e.target.value || null)}
              className={inputClass}
            />
          </Field>
          <Field label="Country">
            <input
              value={form.country ?? ""}
              onChange={(e) => update("country", e.target.value || null)}
              className={inputClass}
            />
          </Field>
          <Field label="Marital status">
            <select
              value={form.maritalStatus ?? ""}
              onChange={(e) =>
                update("maritalStatus", (e.target.value || null) as MaritalStatus | null)
              }
              className={inputClass}
            >
              <option value="">Select…</option>
              {MARITAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Have children?">
            <select
              value={form.hasChildren === null ? "" : String(form.hasChildren)}
              onChange={(e) =>
                update("hasChildren", e.target.value === "" ? null : e.target.value === "true")
              }
              className={inputClass}
            >
              <option value="">Select…</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>
          <Field label="Education level">
            <select
              value={form.educationLevel ?? ""}
              onChange={(e) =>
                update("educationLevel", (e.target.value || null) as EducationLevel | null)
              }
              className={inputClass}
            >
              <option value="">Select…</option>
              {EDUCATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Field of study (optional)">
            <input
              value={form.fieldOfStudy ?? ""}
              onChange={(e) => update("fieldOfStudy", e.target.value || null)}
              className={inputClass}
            />
          </Field>
          <Field label="Profession">
            <input
              value={form.profession ?? ""}
              onChange={(e) => update("profession", e.target.value || null)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 rounded-2xl border border-black/10 p-4 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">Lifestyle</p>
          <Field label="Smoking">
            <select
              value={form.smoking ?? ""}
              onChange={(e) => update("smoking", (e.target.value || null) as HabitLevel | null)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {HABIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Alcohol">
            <select
              value={form.alcohol ?? ""}
              onChange={(e) => update("alcohol", (e.target.value || null) as HabitLevel | null)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {HABIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-4 rounded-2xl border border-black/10 p-4">
          <p className="text-sm font-semibold">About</p>
          <Field label="About me">
            <textarea
              rows={4}
              value={form.aboutMe ?? ""}
              onChange={(e) => update("aboutMe", e.target.value || null)}
              className={inputClass}
            />
          </Field>
          <Field label="What I'm looking for">
            <textarea
              rows={4}
              value={form.lookingFor ?? ""}
              onChange={(e) => update("lookingFor", e.target.value || null)}
              className={inputClass}
            />
          </Field>
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

      <div className="mt-10 rounded-2xl border border-red-200 p-4 dark:border-red-900/40">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">Danger zone</p>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Permanently delete your account, profile, photos, and event RSVPs. This can&apos;t be
          undone.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="mt-3 rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          {deleting ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </div>
  );
}
