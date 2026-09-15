import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_PHOTOS = 6;
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB, under Vercel's request body limit
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Image must be under 4MB." }, { status: 400 });
  }

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
    include: { photos: true },
  });

  if (profile.photos.length >= MAX_PHOTOS) {
    return NextResponse.json({ error: `You can upload up to ${MAX_PHOTOS} photos.` }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const pathname = `profile-photos/${session.user.id}/${crypto.randomUUID()}.${ext}`;

  const blob = await put(pathname, file, { access: "public" });

  const photo = await prisma.profilePhoto.create({
    data: {
      profileId: profile.id,
      url: blob.url,
      order: profile.photos.length,
      isPrimary: profile.photos.length === 0,
    },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
