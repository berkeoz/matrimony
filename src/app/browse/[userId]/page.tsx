import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile, isProfileComplete, MARITAL_STATUS_LABELS, EDUCATION_LEVEL_LABELS, HABIT_LEVEL_LABELS } from "@/lib/profile";
import {
  getCandidateProfile,
  getInterestStatus,
  getInterestUsage,
} from "@/lib/matching";
import { hasActiveSubscription } from "@/lib/subscription";
import ProfileActions from "@/components/ProfileActions";

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { userId } = await params;
  if (userId === session.user.id) {
    redirect("/profile");
  }

  const viewerProfile = await getProfile(session.user.id);
  if (!isProfileComplete(viewerProfile)) {
    redirect("/browse");
  }

  const candidate = await getCandidateProfile(session.user.id, userId);
  if (!candidate) notFound();

  const [interestStatusResult, interestUsage, subscribed] = await Promise.all([
    getInterestStatus(session.user.id, userId),
    getInterestUsage(session.user.id),
    hasActiveSubscription(session.user.id),
  ]);

  const primaryPhoto = candidate.photoUrls[0] ?? null;
  const galleryPhotos = candidate.photoUrls.slice(1);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/browse" className="text-sm font-semibold text-rose-700 hover:underline">
        ← Back to Browse
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10">
        <div className="relative aspect-square w-full bg-neutral-100 dark:bg-neutral-800">
          {primaryPhoto && <Image src={primaryPhoto} alt="" fill sizes="600px" className="object-cover" />}
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {candidate.name}
            {candidate.age !== null && (
              <span className="font-normal text-neutral-500">, {candidate.age}</span>
            )}
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {[candidate.city, candidate.memleket].filter(Boolean).join(" · ")}
          </p>
          {candidate.profession && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{candidate.profession}</p>
          )}

          {subscribed ? (
            <div className="mt-6 space-y-6 border-t border-black/10 pt-6">
              {galleryPhotos.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                    More photos
                  </h2>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {galleryPhotos.map((url) => (
                      <div
                        key={url}
                        className="relative aspect-square overflow-hidden rounded-lg border border-black/10 bg-neutral-100 dark:bg-neutral-800"
                      >
                        <Image src={url} alt="" fill sizes="200px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase text-neutral-500">Country</dt>
                  <dd className="mt-0.5">{candidate.country ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-neutral-500">Height</dt>
                  <dd className="mt-0.5">{candidate.heightCm ? `${candidate.heightCm} cm` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-neutral-500">Education</dt>
                  <dd className="mt-0.5">
                    {candidate.educationLevel ? EDUCATION_LEVEL_LABELS[candidate.educationLevel] : "—"}
                    {candidate.fieldOfStudy ? ` — ${candidate.fieldOfStudy}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-neutral-500">Marital status</dt>
                  <dd className="mt-0.5">
                    {candidate.maritalStatus ? MARITAL_STATUS_LABELS[candidate.maritalStatus] : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-neutral-500">Children</dt>
                  <dd className="mt-0.5">
                    {candidate.hasChildren === null ? "—" : candidate.hasChildren ? "Has children" : "No children"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-neutral-500">Smoking</dt>
                  <dd className="mt-0.5">{candidate.smoking ? HABIT_LEVEL_LABELS[candidate.smoking] : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-neutral-500">Alcohol</dt>
                  <dd className="mt-0.5">{candidate.alcohol ? HABIT_LEVEL_LABELS[candidate.alcohol] : "—"}</dd>
                </div>
              </dl>

              {candidate.aboutMe && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-rose-700">About</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                    {candidate.aboutMe}
                  </p>
                </div>
              )}

              {candidate.lookingFor && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                    Looking for
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                    {candidate.lookingFor}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-black/15 bg-neutral-50 p-4 text-sm dark:border-white/15 dark:bg-neutral-900">
              <p className="text-neutral-600 dark:text-neutral-400">
                More photos, education, habits, about {candidate.name.split(" ")[0]}, and what
                they&apos;re looking for are visible to subscribers.
              </p>
              <Link
                href="/subscribe"
                className="mt-2 inline-block font-semibold text-rose-700 hover:underline"
              >
                Subscribe to see the full profile →
              </Link>
            </div>
          )}

          <div className="mt-6 border-t border-black/10 pt-6">
            <ProfileActions
              userId={userId}
              initialStatus={interestStatusResult.status}
              initialMatchId={interestStatusResult.status === "matched" ? interestStatusResult.matchId : undefined}
              interestUsage={interestUsage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
