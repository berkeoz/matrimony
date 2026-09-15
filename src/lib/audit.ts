import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logAction(params: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { actorId, action, targetType, targetId, metadata } = params;
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    // Never let logging itself break the action being logged.
    console.error("Failed to write audit log", err);
  }
}

export type AuditLogEntry = {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: Date;
};

export async function getAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { name: true, email: true } } },
  });

  return entries.map((e) => ({
    id: e.id,
    actorName: e.actor?.name ?? null,
    actorEmail: e.actor?.email ?? null,
    action: e.action,
    targetType: e.targetType,
    targetId: e.targetId,
    metadata: e.metadata,
    createdAt: e.createdAt,
  }));
}
