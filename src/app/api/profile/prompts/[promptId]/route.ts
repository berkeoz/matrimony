import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { deletePromptAnswer } from "@/lib/prompts";

export async function DELETE(request: Request, { params }: { params: Promise<{ promptId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const profile = await getProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const { promptId } = await params;
  await deletePromptAnswer(profile.id, promptId);
  return NextResponse.json({ ok: true });
}
