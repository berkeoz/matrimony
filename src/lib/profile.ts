import { prisma } from "@/lib/prisma";
import type { Profile, ProfilePhoto } from "@prisma/client";

export type ProfileWithPhotos = Profile & { photos: ProfilePhoto[] };

export async function getProfile(userId: string): Promise<ProfileWithPhotos | null> {
  return prisma.profile.findUnique({
    where: { userId },
    include: { photos: { orderBy: { order: "asc" } } },
  });
}

// Fields that must be filled (plus at least one photo) for a profile to be
// considered complete. fieldOfStudy is deliberately excluded — it's genuinely
// optional (not everyone has one to report).
const REQUIRED_FIELDS = [
  "gender",
  "seekingGender",
  "birthDate",
  "heightCm",
  "city",
  "memleket",
  "country",
  "maritalStatus",
  "hasChildren",
  "educationLevel",
  "profession",
  "smoking",
  "alcohol",
  "aboutMe",
  "lookingFor",
] as const satisfies readonly (keyof Profile)[];

export function isProfileComplete(profile: ProfileWithPhotos | null): boolean {
  if (!profile) return false;
  const fieldsFilled = REQUIRED_FIELDS.every((field) => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== "";
  });
  return fieldsFilled && profile.photos.length > 0;
}

export function profileCompleteness(profile: ProfileWithPhotos | null): {
  filled: number;
  total: number;
  complete: boolean;
} {
  const total = REQUIRED_FIELDS.length + 1; // +1 for "has a photo"
  if (!profile) return { filled: 0, total, complete: false };

  const filled =
    REQUIRED_FIELDS.filter((field) => {
      const value = profile[field];
      return value !== null && value !== undefined && value !== "";
    }).length + (profile.photos.length > 0 ? 1 : 0);

  return { filled, total, complete: filled === total };
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}
