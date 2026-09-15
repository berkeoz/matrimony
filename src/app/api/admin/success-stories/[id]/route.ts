import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { successStorySchema } from "@/lib/validation";
import { logAction } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = successStorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const story = await prisma.successStory.update({ where: { id }, data: parsed.data });

  await logAction({
    actorId: session!.user.id,
    action: "success-story.update",
    targetType: "SuccessStory",
    targetId: story.id,
    metadata: { names: story.names },
  });

  return NextResponse.json({ story });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const story = await prisma.successStory.delete({ where: { id } });

  await logAction({
    actorId: session!.user.id,
    action: "success-story.delete",
    targetType: "SuccessStory",
    targetId: id,
    metadata: { names: story.names },
  });

  return NextResponse.json({ ok: true });
}
