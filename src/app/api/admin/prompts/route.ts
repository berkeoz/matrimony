import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { promptSchema } from "@/lib/validation";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = promptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const prompt = await prisma.prompt.create({ data: parsed.data });

  await logAction({
    actorId: session!.user.id,
    action: "prompt.create",
    targetType: "Prompt",
    targetId: prompt.id,
    metadata: { text: prompt.text },
  });

  return NextResponse.json({ prompt }, { status: 201 });
}
