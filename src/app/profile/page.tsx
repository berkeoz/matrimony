import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile, profileCompleteness } from "@/lib/profile";
import { getBlockedUsers } from "@/lib/blocking";
import { getActivePrompts, getProfilePromptAnswers, MAX_PROMPT_ANSWERS } from "@/lib/prompts";
import ProfileForm, { type ProfileFormData } from "@/components/ProfileForm";
import AccountForm from "@/components/AccountForm";
import BlockedUsersManager from "@/components/BlockedUsersManager";
import ProfilePromptsManager from "@/components/ProfilePromptsManager";

function toDateInputValue(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [profile, blockedUsers, activePrompts] = await Promise.all([
    getProfile(session.user.id),
    getBlockedUsers(session.user.id),
    getActivePrompts(),
  ]);
  const promptAnswers = profile ? await getProfilePromptAnswers(profile.id) : [];
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
    pets: profile?.pets ?? null,
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
        {profile ? (
          <ProfilePromptsManager
            activePrompts={activePrompts.map((p) => ({ id: p.id, text: p.text }))}
            answers={promptAnswers}
            maxAnswers={MAX_PROMPT_ANSWERS}
          />
        ) : (
          <div className="rounded-2xl border border-black/10 p-4">
            <p className="text-sm font-semibold">Prompts</p>
            <p className="mt-1 text-sm text-neutral-500">
              Save your profile basics below first, then come back to add prompts.
            </p>
          </div>
        )}
        <BlockedUsersManager users={blockedUsers} />
      </div>
    </div>
  );
}
