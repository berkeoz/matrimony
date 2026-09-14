import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: "Email is already verified." }, { status: 400 });
  }

  const rawToken = await createVerificationToken(user.email);
  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/api/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

  await sendVerificationEmail({
    to: user.email,
    name: user.name ?? "there",
    verifyUrl,
  });

  return NextResponse.json({ ok: true });
}
