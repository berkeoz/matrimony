import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

// Display-only for now — nothing charges a card until Stripe is wired up
// (see docs/PRODUCT.md). Hardcoded rather than admin-editable since these
// will need to become real Stripe Price objects at that point anyway.
export const PLAN_PRICE_CENTS: Record<SubscriptionPlan, number> = {
  MONTHLY: 1999,
  YEARLY: 19900,
};

function addDuration(from: Date, plan: SubscriptionPlan): Date {
  const result = new Date(from);
  if (plan === "MONTHLY") {
    result.setMonth(result.getMonth() + 1);
  } else {
    result.setFullYear(result.getFullYear() + 1);
  }
  return result;
}

export type SubscriptionSummary = {
  plan: SubscriptionPlan;
  status: "ACTIVE" | "CANCELLED";
  expiresAt: Date;
  isActive: boolean;
};

export async function getSubscription(userId: string): Promise<SubscriptionSummary | null> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return null;
  return {
    plan: sub.plan,
    status: sub.status,
    expiresAt: sub.expiresAt,
    isActive: sub.status === "ACTIVE" && sub.expiresAt > new Date(),
  };
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId);
  return sub?.isActive ?? false;
}

// Extends from the current expiry if already active (so granting more time
// stacks instead of overwriting), otherwise starts fresh from now.
export async function grantSubscription(
  userId: string,
  plan: SubscriptionPlan
): Promise<SubscriptionSummary> {
  const existing = await getSubscription(userId);
  const base = existing?.isActive ? existing.expiresAt : new Date();
  const expiresAt = addDuration(base, plan);

  const sub = await prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan, status: "ACTIVE", expiresAt },
    update: { plan, status: "ACTIVE", expiresAt },
  });

  return {
    plan: sub.plan,
    status: sub.status,
    expiresAt: sub.expiresAt,
    isActive: true,
  };
}

export async function cancelSubscription(userId: string): Promise<void> {
  await prisma.subscription.updateMany({ where: { userId }, data: { status: "CANCELLED" } });
}
