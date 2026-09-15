import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile, profileCompleteness } from "@/lib/profile";
import ProfileForm, { type ProfileFormData } from "@/components/ProfileForm";
import AccountForm from "@/components/AccountForm";

function toDateInputValue(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const profile = await getProfile(session.user.id);
  const completeness = profileCompleteness(profile);

  const initial: ProfileFormData = {
    gender: profile?.gender ?? null,
    birthDate: toDateInputValue(profile?.birthDate ?? null),
    heightCm: profile?.heightCm ?? null,
    city: profile?.city ?? null,
    memleket: profile?.memleket ?? null,
    country: profile?.country ?? null,
    maritalStatus: profile?.maritalStatus ?? null,
    hasChildren: profile?.hasChildren ?? null,
    educationLevel: profile?.educationLevel ?? null,
    fieldOfStudy: profile?.fieldOfStudy ?? null,
    profession: profile?.profession ?? null,
    smoking: profile?.smoking ?? null,
    alcohol: profile?.alcohol ?? null,
    aboutMe: profile?.aboutMe ?? null,
    lookingFor: profile?.lookingFor ?? null,
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">My profile</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        This is what other members will eventually see. Keep it accurate and complete.
      </p>

      <div className="mt-8 space-y-6">
        <AccountForm initialName={session.user.name ?? ""} initialEmail={session.user.email ?? ""} />
        <ProfileForm
          initial={initial}
          photos={profile?.photos.map((p) => ({ id: p.id, url: p.url, isPrimary: p.isPrimary })) ?? []}
          completeness={completeness}
        />
      </div>
    </div>
  );
}
