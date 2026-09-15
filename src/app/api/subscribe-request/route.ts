import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/subscription";
import { subscriptionRequestSchema } from "@/lib/validation";
import { sendSubscriptionRequestEmail } from "@/lib/mail";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (await hasActiveSubscription(session.user.id)) {
    return NextResponse.json({ error: "You already have an active subscription." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = subscriptionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
  const origin = new URL(request.url).origin;

  await Promise.all(
    admins.map((admin) =>
      sendSubscriptionRequestEmail({
        to: admin.email,
        fromName: session.user.name ?? "A member",
        fromEmail: session.user.email!,
        plan: parsed.data.plan,
        manageUrl: `${origin}/admin/users`,
      }).catch((err) => console.error("Failed to send subscription request email", err))
    )
  );

  return NextResponse.json({ ok: true });
}
