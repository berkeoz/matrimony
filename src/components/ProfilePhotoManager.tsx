"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Image from "next/image";

type Photo = { id: string; url: string; isPrimary: boolean };

export default function ProfilePhotoManager({ photos: initialPhotos }: { photos: Photo[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/profile/photos", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!res.ok) {
      setError(data.error ?? "Failed to upload photo.");
      return;
    }
    setPhotos((prev) => [...prev, data.photo]);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this photo?")) return;
    const res = await fetch(`/api/profile/photos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    }
  }

  async function handleSetPrimary(id: string) {
    const res = await fetch(`/api/profile/photos/${id}`, { method: "PATCH" });
    if (res.ok) {
      setPhotos((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === id })));
      router.refresh();
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl border border-black/10">
            <Image
              src={photo.url}
              alt=""
              fill
              sizes="200px"
              className="object-cover"
            />
            {photo.isPrimary && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-rose-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                Primary
              </span>
            )}
            <div className="absolute inset-0 flex items-end justify-center gap-2 bg-black/40 p-2 opacity-0 transition group-hover:opacity-100">
              {!photo.isPrimary && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(photo.id)}
                  className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-black"
                >
                  Make primary
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {photos.length < 6 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-black/20 text-center text-xs text-neutral-500 hover:border-rose-700 hover:text-rose-700 dark:border-white/20">
            {uploading ? (
              "Uploading…"
            ) : (
              <>
                <span className="text-xl">+</span>
                Add photo
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        At least one photo is required. Up to 6, JPEG/PNG/WebP, 4MB max each.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
