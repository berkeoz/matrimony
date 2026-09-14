import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { eventSchema } from "@/lib/validation";
import { parseWallClockDateTime } from "@/lib/datetime";

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.event.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "An event with this slug already exists." }, { status: 409 });
  }

  const { startsAt, ...rest } = parsed.data;
  const event = await prisma.event.create({
    data: { ...rest, startsAt: parseWallClockDateTime(startsAt) },
  });

  return NextResponse.json({ event }, { status: 201 });
}
