import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { adminCreateUserSchema } from "@/lib/validation";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = adminCreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, emailVerified: new Date() },
    select: { id: true, name: true, email: true, role: true },
  });

  await logAction({
    actorId: session!.user.id,
    action: "user.create",
    targetType: "User",
    targetId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  return NextResponse.json({ user }, { status: 201 });
}
