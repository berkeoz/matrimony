import { prisma } from "@/lib/prisma";
import { calculateAge, isProfileComplete } from "@/lib/profile";
import { hasActiveSubscription } from "@/lib/subscription";
import type { EducationLevel, MaritalStatus, HabitLevel } from "@prisma/client";

// Passing is unlimited (it's just skipping someone) — this caps how many
// people a free member can pursue by expressing interest, the mechanic that
// actually consumes the platform's matchmaking value.
export const FREE_INTEREST_LIMIT = 2;

export type InterestUsage = { used: number; limit: number; unlimited: boolean };

export async function getInterestUsage(userId: string): Promise<InterestUsage> {
  const unlimited = await hasActiveSubscription(userId);
  const used = await prisma.interest.count({ where: { fromUserId: userId } });
  return { used, limit: FREE_INTEREST_LIMIT, unlimited };
}

export async function canExpressInterest(userId: string): Promise<boolean> {
  const usage = await getInterestUsage(userId);
  return usage.unlimited || usage.used < usage.limit;
}

export type BrowseFilters = {
  city?: string;
  minAge?: number;
  maxAge?: number;
  educationLevel?: EducationLevel;
  maritalStatus?: MaritalStatus;
  hasChildren?: boolean;
  smoking?: HabitLevel;
  alcohol?: HabitLevel;
};

export type BrowseCard = {
  userId: string;
  name: string;
  age: number | null;
  city: string | null;
  memleket: string | null;
  profession: string | null;
  photoUrl: string | null;
};

const PAGE_SIZE = 12;

function birthDateRange(minAge?: number, maxAge?: number) {
  const today = new Date();
  const range: { lte?: Date; gte?: Date } = {};
  if (minAge !== undefined) {
    range.lte = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  }
  if (maxAge !== undefined) {
    range.gte = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate() + 1);
  }
  return range;
}

export async function getBrowseCandidates(
  userId: string,
  seekingGender: "MALE" | "FEMALE",
  filters: BrowseFilters,
  page = 1
): Promise<{ cards: BrowseCard[]; hasMore: boolean }> {
  const [interested, passed, matchedAsA, matchedAsB] = await Promise.all([
    prisma.interest.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
    prisma.pass.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
    prisma.match.findMany({ where: { userAId: userId }, select: { userBId: true } }),
    prisma.match.findMany({ where: { userBId: userId }, select: { userAId: true } }),
  ]);

  const excludeIds = new Set([
    userId,
    ...interested.map((i) => i.toUserId),
    ...passed.map((p) => p.toUserId),
    ...matchedAsA.map((m) => m.userBId),
    ...matchedAsB.map((m) => m.userAId),
  ]);

  const { lte, gte } = birthDateRange(filters.minAge, filters.maxAge);

  const profiles = await prisma.profile.findMany({
    where: {
      userId: { notIn: Array.from(excludeIds) },
      gender: seekingGender,
      // Completeness requires all of these to be non-null, so filtering on
      // them here doubles as "only show complete profiles".
      birthDate: { not: null, ...(lte ? { lte } : {}), ...(gte ? { gte } : {}) },
      heightCm: { not: null },
      city: filters.city ? { contains: filters.city, mode: "insensitive" } : { not: null },
      memleket: { not: null },
      country: { not: null },
      maritalStatus: filters.maritalStatus ?? { not: null },
      hasChildren: filters.hasChildren ?? { not: null },
      educationLevel: filters.educationLevel ?? { not: null },
      profession: { not: null },
      smoking: filters.smoking ?? { not: null },
      alcohol: filters.alcohol ?? { not: null },
      aboutMe: { not: null },
      lookingFor: { not: null },
      photos: { some: {} },
    },
    select: {
      userId: true,
      birthDate: true,
      city: true,
      memleket: true,
      profession: true,
      photos: { where: { isPrimary: true }, take: 1, select: { url: true } },
      user: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
  });

  const hasMore = profiles.length > PAGE_SIZE;
  const page_ = profiles.slice(0, PAGE_SIZE);

  return {
    cards: page_.map((p) => ({
      userId: p.userId,
      name: p.user.name ?? "Member",
      age: p.birthDate ? calculateAge(p.birthDate) : null,
      city: p.city,
      memleket: p.memleket,
      profession: p.profession,
      photoUrl: p.photos[0]?.url ?? null,
    })),
    hasMore,
  };
}

export function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export type ExpressInterestResult = { matched: boolean; matchId?: string };

export async function expressInterest(
  fromUserId: string,
  toUserId: string
): Promise<ExpressInterestResult> {
  await prisma.interest.upsert({
    where: { fromUserId_toUserId: { fromUserId, toUserId } },
    create: { fromUserId, toUserId },
    update: {},
  });

  const reciprocal = await prisma.interest.findUnique({
    where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
  });

  if (!reciprocal) {
    return { matched: false };
  }

  const [userAId, userBId] = canonicalPair(fromUserId, toUserId);
  const match = await prisma.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId },
    update: {},
  });

  return { matched: true, matchId: match.id };
}

export async function passUser(fromUserId: string, toUserId: string): Promise<void> {
  await prisma.pass.upsert({
    where: { fromUserId_toUserId: { fromUserId, toUserId } },
    create: { fromUserId, toUserId },
    update: {},
  });
}

export type InterestStatusResult =
  | { status: "none" | "interested" | "passed" }
  | { status: "matched"; matchId: string };

export async function getInterestStatus(
  viewerId: string,
  targetUserId: string
): Promise<InterestStatusResult> {
  const [userAId, userBId] = canonicalPair(viewerId, targetUserId);
  const [interest, pass, match] = await Promise.all([
    prisma.interest.findUnique({
      where: { fromUserId_toUserId: { fromUserId: viewerId, toUserId: targetUserId } },
    }),
    prisma.pass.findUnique({
      where: { fromUserId_toUserId: { fromUserId: viewerId, toUserId: targetUserId } },
    }),
    prisma.match.findUnique({ where: { userAId_userBId: { userAId, userBId } } }),
  ]);

  if (match) return { status: "matched", matchId: match.id };
  if (interest) return { status: "interested" };
  if (pass) return { status: "passed" };
  return { status: "none" };
}

// The full detail view behind a Browse card — gated to opposite-gender,
// profile-complete candidates only (same rule Browse itself uses), so a
// guessed/enumerated userId can't be used to peek at an unrelated profile.
export type CandidateProfile = {
  userId: string;
  name: string;
  age: number | null;
  city: string | null;
  memleket: string | null;
  country: string | null;
  profession: string | null;
  educationLevel: EducationLevel | null;
  fieldOfStudy: string | null;
  maritalStatus: MaritalStatus | null;
  hasChildren: boolean | null;
  smoking: HabitLevel | null;
  alcohol: HabitLevel | null;
  heightCm: number | null;
  aboutMe: string | null;
  lookingFor: string | null;
  photoUrls: string[];
};

export async function getCandidateProfile(
  viewerId: string,
  targetUserId: string
): Promise<CandidateProfile | null> {
  const viewer = await prisma.profile.findUnique({
    where: { userId: viewerId },
    select: { seekingGender: true },
  });
  if (!viewer?.seekingGender) return null;

  const profile = await prisma.profile.findUnique({
    where: { userId: targetUserId },
    include: { photos: { orderBy: { order: "asc" } }, user: { select: { name: true } } },
  });
  if (!profile || profile.gender !== viewer.seekingGender) return null;
  if (!isProfileComplete(profile)) return null;

  return {
    userId: targetUserId,
    name: profile.user.name ?? "Member",
    age: profile.birthDate ? calculateAge(profile.birthDate) : null,
    city: profile.city,
    memleket: profile.memleket,
    country: profile.country,
    profession: profile.profession,
    educationLevel: profile.educationLevel,
    fieldOfStudy: profile.fieldOfStudy,
    maritalStatus: profile.maritalStatus,
    hasChildren: profile.hasChildren,
    smoking: profile.smoking,
    alcohol: profile.alcohol,
    heightCm: profile.heightCm,
    aboutMe: profile.aboutMe,
    lookingFor: profile.lookingFor,
    photoUrls: profile.photos.map((p) => p.url),
  };
}

// People who've expressed interest in you that you haven't matched with (or
// passed on) yet. Passing/matching moves someone out of this list — passing
// because you've already said no, matching because they've moved to Matches.
async function getExcludedLikerIds(userId: string): Promise<Set<string>> {
  const [passed, matchedA, matchedB] = await Promise.all([
    prisma.pass.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
    prisma.match.findMany({ where: { userAId: userId }, select: { userBId: true } }),
    prisma.match.findMany({ where: { userBId: userId }, select: { userAId: true } }),
  ]);
  return new Set([
    userId,
    ...passed.map((p) => p.toUserId),
    ...matchedA.map((m) => m.userBId),
    ...matchedB.map((m) => m.userAId),
  ]);
}

export async function getReceivedLikesCount(userId: string): Promise<number> {
  const excludeIds = await getExcludedLikerIds(userId);
  return prisma.interest.count({
    where: { toUserId: userId, fromUserId: { notIn: Array.from(excludeIds) } },
  });
}

export type LikeCard = BrowseCard & { likedAt: Date };

export async function getReceivedLikes(userId: string): Promise<LikeCard[]> {
  const excludeIds = await getExcludedLikerIds(userId);
  const incoming = await prisma.interest.findMany({
    where: { toUserId: userId, fromUserId: { notIn: Array.from(excludeIds) } },
    orderBy: { createdAt: "desc" },
    include: {
      fromUser: {
        select: {
          name: true,
          profile: {
            select: {
              birthDate: true,
              city: true,
              memleket: true,
              profession: true,
              photos: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });

  return incoming
    .filter((i) => i.fromUser.profile)
    .map((i) => ({
      userId: i.fromUserId,
      name: i.fromUser.name ?? "Member",
      age: i.fromUser.profile!.birthDate ? calculateAge(i.fromUser.profile!.birthDate!) : null,
      city: i.fromUser.profile!.city,
      memleket: i.fromUser.profile!.memleket,
      profession: i.fromUser.profile!.profession,
      photoUrl: i.fromUser.profile!.photos[0]?.url ?? null,
      likedAt: i.createdAt,
    }));
}

export type MatchCard = {
  userId: string;
  name: string;
  age: number | null;
  city: string | null;
  photoUrl: string | null;
  matchedAt: Date;
};

export async function getMatches(userId: string): Promise<MatchCard[]> {
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      userA: {
        select: {
          id: true,
          name: true,
          profile: {
            select: { city: true, birthDate: true, photos: { where: { isPrimary: true }, take: 1, select: { url: true } } },
          },
        },
      },
      userB: {
        select: {
          id: true,
          name: true,
          profile: {
            select: { city: true, birthDate: true, photos: { where: { isPrimary: true }, take: 1, select: { url: true } } },
          },
        },
      },
    },
  });

  return matches.map((m) => {
    const other = m.userAId === userId ? m.userB : m.userA;
    return {
      userId: other.id,
      name: other.name ?? "Member",
      age: other.profile?.birthDate ? calculateAge(other.profile.birthDate) : null,
      city: other.profile?.city ?? null,
      photoUrl: other.profile?.photos[0]?.url ?? null,
      matchedAt: m.createdAt,
    };
  });
}
