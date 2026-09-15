import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAction } from "@/lib/audit";
import { sendEventApprovedEmail, sendEventRejectedEmail } from "@/lib/mail";

const schema = z.object({ action: z.enum(["approve", "reject"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const before = await prisma.event.findUnique({
    where: { id },
    include: { organizerUser: { select: { name: true, email: true } } },
  });
  if (!before) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const reviewStatus = parsed.data.action === "approve" ? "APPROVED" : "REJECTED";
  const event = await prisma.event.update({ where: { id }, data: { reviewStatus } });

  if (before.organizerUser) {
    try {
      if (reviewStatus === "APPROVED") {
        await sendEventApprovedEmail({
          to: before.organizerUser.email,
          name: before.organizerUser.name ?? "there",
          eventTitle: event.title,
        });
      } else {
        await sendEventRejectedEmail({
          to: before.organizerUser.email,
          name: before.organizerUser.name ?? "there",
          eventTitle: event.title,
        });
      }
    } catch (err) {
      console.error("Failed to send event review email", err);
    }
  }

  await logAction({
    actorId: session!.user.id,
    action: reviewStatus === "APPROVED" ? "event.approve" : "event.reject",
    targetType: "Event",
    targetId: event.id,
    metadata: { title: event.title },
  });

  return NextResponse.json({ event });
}
