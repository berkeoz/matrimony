import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validation";
import { sendContactMessageEmail } from "@/lib/mail";
import { verifyTurnstile } from "@/lib/turnstile";

const MIN_SUBMIT_MS = 2000; // reject submissions faster than a human could type

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, message, website, startedAt } = parsed.data;

  // Honeypot field filled in, submitted implausibly fast, or failed the
  // CAPTCHA — likely a bot. Treated identically (a silent no-op) so a bot
  // can't tell which check caught it.
  if (website || Date.now() - startedAt < MIN_SUBMIT_MS || !(await verifyTurnstile(body?.turnstileToken))) {
    return NextResponse.json({ ok: true });
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });

  await Promise.all(
    admins.map((admin) =>
      sendContactMessageEmail({
        to: admin.email,
        fromName: name,
        fromEmail: email,
        message,
      }).catch((err) => console.error("Failed to send contact email", err))
    )
  );

  return NextResponse.json({ ok: true });
}
