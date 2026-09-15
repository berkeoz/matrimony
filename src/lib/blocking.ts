import { prisma } from "@/lib/prisma";

export async function isBlocked(userA: string, userB: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { fromUserId: userA, toUserId: userB },
        { fromUserId: userB, toUserId: userA },
      ],
    },
  });
  return Boolean(block);
}

// All userIds blocked in either direction — used to exclude someone from
// Browse/Likes/Matches regardless of who blocked whom.
export async function getBlockedIds(userId: string): Promise<Set<string>> {
  const [sent, received] = await Promise.all([
    prisma.block.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
    prisma.block.findMany({ where: { toUserId: userId }, select: { fromUserId: true } }),
  ]);
  return new Set([...sent.map((b) => b.toUserId), ...received.map((b) => b.fromUserId)]);
}

export async function blockUser(fromUserId: string, toUserId: string): Promise<void> {
  await prisma.block.upsert({
    where: { fromUserId_toUserId: { fromUserId, toUserId } },
    create: { fromUserId, toUserId },
    update: {},
  });
}

export async function unblockUser(fromUserId: string, toUserId: string): Promise<void> {
  await prisma.block.deleteMany({ where: { fromUserId, toUserId } });
}

export type BlockedUser = {
  userId: string;
  name: string;
  photoUrl: string | null;
  blockedAt: Date;
};

export async function getBlockedUsers(userId: string): Promise<BlockedUser[]> {
  const blocks = await prisma.block.findMany({
    where: { fromUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      toUser: {
        select: {
          name: true,
          profile: { select: { photos: { where: { isPrimary: true }, take: 1, select: { url: true } } } },
        },
      },
    },
  });

  return blocks.map((b) => ({
    userId: b.toUserId,
    name: b.toUser.name ?? "Member",
    photoUrl: b.toUser.profile?.photos[0]?.url ?? null,
    blockedAt: b.createdAt,
  }));
}
