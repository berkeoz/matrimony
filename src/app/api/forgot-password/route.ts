import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/password-reset-token";
import { sendPasswordResetEmail } from "@/lib/mail";
import { verifyTurnstile } from "@/lib/turnstile";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

// Always returns a generic success message, whether or not the email
// exists, to avoid leaking which addresses have accounts. A failed CAPTCHA
// is treated the same way — silently no-op — rather than telling a bot
// specifically what went wrong.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!(await verifyTurnstile(body?.turnstileToken))) {
    return NextResponse.json({ ok: true });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.passwordHash) {
    const rawToken = await createPasswordResetToken(email);
    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendPasswordResetEmail({ to: email, name: user.name ?? "there", resetUrl });
    } catch (err) {
      console.error("Failed to send password reset email", err);
    }
  }

  return NextResponse.json({ ok: true });
}
