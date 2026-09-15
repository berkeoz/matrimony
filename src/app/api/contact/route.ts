import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validation";
import { sendContactMessageEmail } from "@/lib/mail";

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

  // Honeypot field filled in, or submitted implausibly fast — likely a bot.
  if (website || Date.now() - startedAt < MIN_SUBMIT_MS) {
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
