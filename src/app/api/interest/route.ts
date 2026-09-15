import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfile, isProfileComplete } from "@/lib/profile";
import { expressInterest } from "@/lib/matching";
import { interestActionSchema } from "@/lib/validation";
import { sendMatchEmail } from "@/lib/mail";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const profile = await getProfile(session.user.id);
  if (!isProfileComplete(profile)) {
    return NextResponse.json(
      { error: "Complete your profile first.", code: "PROFILE_INCOMPLETE" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = interestActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { toUserId } = parsed.data;
  if (toUserId === session.user.id) {
    return NextResponse.json({ error: "You can't express interest in yourself." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!target) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const result = await expressInterest(session.user.id, toUserId);

  if (result.matched) {
    const origin = new URL(request.url).origin;
    const matchesUrl = `${origin}/matches`;
    try {
      await Promise.all([
        sendMatchEmail({
          to: target.email,
          name: target.name ?? "there",
          matchName: session.user.name ?? "A member",
          matchesUrl,
        }),
        sendMatchEmail({
          to: session.user.email!,
          name: session.user.name ?? "there",
          matchName: target.name ?? "A member",
          matchesUrl,
        }),
      ]);
    } catch (err) {
      console.error("Failed to send match email", err);
    }
  }

  return NextResponse.json(result);
}
