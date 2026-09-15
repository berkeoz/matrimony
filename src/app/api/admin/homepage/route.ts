import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { homepageContentSchema } from "@/lib/validation";
import { logAction } from "@/lib/audit";

export async function PATCH(request: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = homepageContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const content = await prisma.homepageContent.upsert({
    where: { id: "homepage" },
    create: { id: "homepage", ...parsed.data },
    update: parsed.data,
  });

  await logAction({
    actorId: session!.user.id,
    action: "homepage.update",
    targetType: "HomepageContent",
    targetId: "homepage",
  });

  return NextResponse.json({ content });
}
