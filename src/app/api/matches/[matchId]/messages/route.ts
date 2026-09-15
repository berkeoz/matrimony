import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserMatch, getMessages, sendMessage, markRead } from "@/lib/messaging";
import { sendMessageSchema } from "@/lib/validation";
import { sendNewMessageEmail } from "@/lib/mail";

export async function GET(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { matchId } = await params;
  const match = await getUserMatch(matchId, session.user.id);
  if (!match) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const messages = await getMessages(matchId);
  await markRead(matchId, session.user.id);

  return NextResponse.json({ match, messages });
}

export async function POST(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { matchId } = await params;
  const match = await getUserMatch(matchId, session.user.id);
  if (!match) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message" },
      { status: 400 }
    );
  }

  const { message, isFirstMessage } = await sendMessage(matchId, session.user.id, parsed.data.body);

  if (isFirstMessage) {
    const recipient = await prisma.user.findUnique({ where: { id: match.otherUserId } });
    if (recipient) {
      const origin = new URL(request.url).origin;
      try {
        await sendNewMessageEmail({
          to: recipient.email,
          name: recipient.name ?? "there",
          fromName: session.user.name ?? "A member",
          conversationUrl: `${origin}/matches/${matchId}`,
        });
      } catch (err) {
        console.error("Failed to send new message email", err);
      }
    }
  }

  return NextResponse.json({ message });
}
