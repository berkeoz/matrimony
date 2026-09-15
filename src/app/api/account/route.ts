import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accountUpdateSchema } from "@/lib/validation";
import { createVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/mail";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = accountUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, currentPassword } = parsed.data;
  const data: { name?: string; email?: string; emailVerified?: null } = {};

  if (name) data.name = name;

  let emailChanged = false;
  if (email) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "This account has no password set, so email can't be changed this way." },
        { status: 400 }
      );
    }
    const validPassword = await bcrypt.compare(currentPassword!, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
      }
      data.email = email;
      data.emailVerified = null;
      emailChanged = true;
    }
  }

  const updated = await prisma.user.update({ where: { id: session.user.id }, data });

  if (emailChanged) {
    const rawToken = await createVerificationToken(updated.email);
    const origin = new URL(request.url).origin;
    const verifyUrl = `${origin}/api/verify-email?token=${rawToken}&email=${encodeURIComponent(updated.email)}`;
    try {
      await sendVerificationEmail({ to: updated.email, name: updated.name ?? "there", verifyUrl });
    } catch (err) {
      console.error("Failed to send verification email", err);
    }
  }

  return NextResponse.json({
    name: updated.name,
    email: updated.email,
    emailChanged,
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (session.user.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "You're the only admin — promote someone else to admin before deleting your account." },
        { status: 400 }
      );
    }
  }

  const photos = await prisma.profilePhoto.findMany({
    where: { profile: { userId: session.user.id } },
    select: { url: true },
  });

  await prisma.user.delete({ where: { id: session.user.id } });

  await Promise.all(
    photos.map((photo) => del(photo.url).catch((err) => console.error("Failed to delete blob", err)))
  );

  return NextResponse.json({ ok: true });
}
