import { prisma } from "@/lib/prisma";

export async function getUserMatch(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      userA: { select: { id: true, name: true, profile: { select: { photos: { where: { isPrimary: true }, take: 1, select: { url: true } } } } } },
      userB: { select: { id: true, name: true, profile: { select: { photos: { where: { isPrimary: true }, take: 1, select: { url: true } } } } } },
    },
  });

  if (!match || (match.userAId !== userId && match.userBId !== userId)) {
    return null;
  }

  const other = match.userAId === userId ? match.userB : match.userA;
  return {
    matchId: match.id,
    otherUserId: other.id,
    otherName: other.name ?? "Member",
    otherPhotoUrl: other.profile?.photos[0]?.url ?? null,
  };
}

export async function getMessages(matchId: string) {
  return prisma.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
  });
}

export async function sendMessage(matchId: string, senderId: string, body: string) {
  const existingCount = await prisma.message.count({ where: { matchId } });

  const message = await prisma.message.create({
    data: { matchId, senderId, body },
  });

  return { message, isFirstMessage: existingCount === 0 };
}

export async function markRead(matchId: string, userId: string): Promise<void> {
  await prisma.message.updateMany({
    where: { matchId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function getTotalUnreadCount(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      match: { OR: [{ userAId: userId }, { userBId: userId }] },
    },
  });
}

export type ConversationSummary = {
  matchId: string;
  otherUserId: string;
  otherName: string;
  otherPhotoUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
};

export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, name: true, profile: { select: { photos: { where: { isPrimary: true }, take: 1, select: { url: true } } } } } },
      userB: { select: { id: true, name: true, profile: { select: { photos: { where: { isPrimary: true }, take: 1, select: { url: true } } } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: { messages: { where: { senderId: { not: userId }, readAt: null } } },
      },
    },
  });

  const summaries = matches.map((match) => {
    const other = match.userAId === userId ? match.userB : match.userA;
    const last = match.messages[0];
    return {
      matchId: match.id,
      otherUserId: other.id,
      otherName: other.name ?? "Member",
      otherPhotoUrl: other.profile?.photos[0]?.url ?? null,
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.createdAt ?? match.createdAt,
      unreadCount: match._count.messages,
    };
  });

  summaries.sort((a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0));
  return summaries;
}
