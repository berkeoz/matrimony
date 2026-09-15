import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { upsertPromptAnswer } from "@/lib/prompts";
import { promptAnswerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const profile = await getProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Save your profile basics first." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = promptAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const result = await upsertPromptAnswer(profile.id, parsed.data.promptId, parsed.data.answer);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
