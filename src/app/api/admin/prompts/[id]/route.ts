import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { promptSchema } from "@/lib/validation";
import { logAction } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = promptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const prompt = await prisma.prompt.update({ where: { id }, data: parsed.data });

  await logAction({
    actorId: session!.user.id,
    action: "prompt.update",
    targetType: "Prompt",
    targetId: prompt.id,
    metadata: { text: prompt.text },
  });

  return NextResponse.json({ prompt });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const prompt = await prisma.prompt.delete({ where: { id } });

  await logAction({
    actorId: session!.user.id,
    action: "prompt.delete",
    targetType: "Prompt",
    targetId: id,
    metadata: { text: prompt.text },
  });

  return NextResponse.json({ ok: true });
}
