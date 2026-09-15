import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/profile";
import type { EducationLevel, MaritalStatus, HabitLevel } from "@prisma/client";

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

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export type ExpressInterestResult = { matched: boolean };

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
  await prisma.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId },
    update: {},
  });

  return { matched: true };
}

export async function passUser(fromUserId: string, toUserId: string): Promise<void> {
  await prisma.pass.upsert({
    where: { fromUserId_toUserId: { fromUserId, toUserId } },
    create: { fromUserId, toUserId },
    update: {},
  });
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
