import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
