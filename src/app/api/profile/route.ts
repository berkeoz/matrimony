import { NextResponse } from "next/server";
import type { Gender } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/profile";
import { profileSchema } from "@/lib/validation";

function oppositeGender(gender: Gender | null | undefined): Gender | undefined {
  if (gender === "MALE") return "FEMALE";
  if (gender === "FEMALE") return "MALE";
  return undefined;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const profile = await getProfile(session.user.id);
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { birthDate, ...rest } = parsed.data;

  const data = {
    ...rest,
    birthDate: birthDate ? new Date(birthDate) : birthDate === null ? null : undefined,
    // We only support opposite-gender matching for now, so seekingGender is
    // always derived from gender rather than asked as a separate question.
    seekingGender: oppositeGender(rest.gender),
  };

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
    include: { photos: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ profile });
}
