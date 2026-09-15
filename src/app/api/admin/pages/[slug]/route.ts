import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { pageContentSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = pageContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const page = await prisma.page.upsert({
    where: { slug },
    create: { slug, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ page });
}
