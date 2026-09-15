import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { passUser } from "@/lib/matching";
import { interestActionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = interestActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { toUserId } = parsed.data;
  if (toUserId === session.user.id) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await passUser(session.user.id, toUserId);
  return NextResponse.json({ ok: true });
}
