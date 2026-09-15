import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnedPhoto(photoId: string, userId: string) {
  const photo = await prisma.profilePhoto.findUnique({
    where: { id: photoId },
    include: { profile: true },
  });
  if (!photo || photo.profile.userId !== userId) return null;
  return photo;
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const photo = await getOwnedPhoto(id, session.user.id);
  if (!photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  await prisma.profilePhoto.delete({ where: { id } });
  await del(photo.url).catch((err) => console.error("Failed to delete blob", err));

  if (photo.isPrimary) {
    const next = await prisma.profilePhoto.findFirst({
      where: { profileId: photo.profileId },
      orderBy: { order: "asc" },
    });
    if (next) {
      await prisma.profilePhoto.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const photo = await getOwnedPhoto(id, session.user.id);
  if (!photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.profilePhoto.updateMany({
      where: { profileId: photo.profileId },
      data: { isPrimary: false },
    }),
    prisma.profilePhoto.update({ where: { id }, data: { isPrimary: true } }),
  ]);

  return NextResponse.json({ ok: true });
}
