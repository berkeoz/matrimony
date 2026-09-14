import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { homepageContentSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  const { response } = await requireAdmin();
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

  return NextResponse.json({ content });
}
