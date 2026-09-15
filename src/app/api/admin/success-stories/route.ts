import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { successStorySchema } from "@/lib/validation";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = successStorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const story = await prisma.successStory.create({ data: parsed.data });

  await logAction({
    actorId: session!.user.id,
    action: "success-story.create",
    targetType: "SuccessStory",
    targetId: story.id,
    metadata: { names: story.names },
  });

  return NextResponse.json({ story }, { status: 201 });
}
