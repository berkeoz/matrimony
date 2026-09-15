import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { blockUser, unblockUser } from "@/lib/blocking";

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { userId } = await params;
  if (userId === session.user.id) {
    return NextResponse.json({ error: "You can't block yourself." }, { status: 400 });
  }

  await blockUser(session.user.id, userId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { userId } = await params;
  await unblockUser(session.user.id, userId);
  return NextResponse.json({ ok: true });
}
