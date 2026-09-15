import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { adminSubscriptionActionSchema } from "@/lib/validation";
import { grantSubscription, cancelSubscription, getSubscription } from "@/lib/subscription";
import { logAction } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adminSubscriptionActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (parsed.data.action === "grant") {
    await grantSubscription(id, parsed.data.plan);
  } else {
    await cancelSubscription(id);
  }

  await logAction({
    actorId: session!.user.id,
    action: parsed.data.action === "grant" ? "subscription.grant" : "subscription.cancel",
    targetType: "User",
    targetId: id,
    metadata: parsed.data.action === "grant" ? { plan: parsed.data.plan } : undefined,
  });

  const subscription = await getSubscription(id);
  return NextResponse.json({ subscription });
}
