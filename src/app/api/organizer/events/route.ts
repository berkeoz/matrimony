import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizer } from "@/lib/require-organizer";
import { organizerEventSchema } from "@/lib/validation";
import { parseWallClockDateTime } from "@/lib/datetime";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  const { session, response } = await requireOrganizer();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = organizerEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.event.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "An event with this slug already exists." }, { status: 409 });
  }

  const { startsAt, ...rest } = parsed.data;
  const event = await prisma.event.create({
    data: {
      ...rest,
      priceCents: 0,
      startsAt: parseWallClockDateTime(startsAt),
      organizerId: session!.user.id,
      reviewStatus: "PENDING",
    },
  });

  await logAction({
    actorId: session!.user.id,
    action: "event.create",
    targetType: "Event",
    targetId: event.id,
    metadata: { title: event.title, slug: event.slug, byOrganizer: true },
  });

  return NextResponse.json({ event }, { status: 201 });
}
