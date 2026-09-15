import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSubscription, PLAN_PRICE_CENTS } from "@/lib/subscription";
import { FREE_INTEREST_LIMIT } from "@/lib/matching";
import { FREE_MESSAGE_LIMIT } from "@/lib/messaging";
import SubscribeRequestButton from "@/components/SubscribeRequestButton";

function formatPrice(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-green-600 dark:text-green-400">✓</span>
      <span>{children}</span>
    </li>
  );
}

export default async function SubscribePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const subscription = await getSubscription(session.user.id);
  const currentPlan = subscription?.isActive ? subscription.plan : "FREE";

  const monthlyPrice = formatPrice(PLAN_PRICE_CENTS.MONTHLY);
  const yearlyPrice = formatPrice(PLAN_PRICE_CENTS.YEARLY);
  const yearlyMonthlyEquivalent = formatPrice(Math.round(PLAN_PRICE_CENTS.YEARLY / 12));

  const cardBase = "rounded-2xl border p-6 flex flex-col";
  const currentCardClass = "border-rose-700 ring-2 ring-rose-700/20";
  const normalCardClass = "border-black/10";

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Subscribe</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        A subscription waives the fee on paid events and removes the free-tier limits on
        expressing interest and messaging.
      </p>

      <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        Online payments aren&apos;t set up yet. Requesting a plan below sends us a note — we&apos;ll
        reach out to arrange payment and then activate it on your account.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {/* Free */}
        <div className={`${cardBase} ${currentPlan === "FREE" ? currentCardClass : normalCardClass}`}>
          {currentPlan === "FREE" && (
            <span className="mb-2 inline-block w-fit rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
              Your current plan
            </span>
          )}
          <h2 className="text-lg font-semibold">Free</h2>
          <p className="mt-1 text-2xl font-semibold">
            $0<span className="text-sm font-normal text-neutral-500"> / forever</span>
          </p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Check>Browse unlimited profiles</Check>
            <Check>Express interest in up to {FREE_INTEREST_LIMIT} people</Check>
            <Check>Message up to {FREE_MESSAGE_LIMIT} matches</Check>
            <Check>RSVP to free events</Check>
          </ul>
          {currentPlan === "FREE" && (
            <p className="mt-4 text-xs text-neutral-400">You&apos;re on this plan.</p>
          )}
        </div>

        {/* Monthly */}
        <div className={`${cardBase} ${currentPlan === "MONTHLY" ? currentCardClass : normalCardClass}`}>
          {currentPlan === "MONTHLY" && (
            <span className="mb-2 inline-block w-fit rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
              Your current plan
            </span>
          )}
          <h2 className="text-lg font-semibold">Monthly</h2>
          <p className="mt-1 text-2xl font-semibold">
            {monthlyPrice}
            <span className="text-sm font-normal text-neutral-500"> / month</span>
          </p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Check>Everything in Free, plus:</Check>
            <Check>Unlimited interest — pursue as many people as you want</Check>
            <Check>Unlimited messaging</Check>
            <Check>Free entry to every paid event</Check>
          </ul>
          <div className="mt-4">
            {currentPlan === "MONTHLY" ? (
              <p className="text-xs text-neutral-400">
                Active until{" "}
                {subscription!.expiresAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                .
              </p>
            ) : (
              <SubscribeRequestButton plan="MONTHLY" />
            )}
          </div>
        </div>

        {/* Yearly */}
        <div className={`${cardBase} ${currentPlan === "YEARLY" ? currentCardClass : normalCardClass}`}>
          <div className="mb-2 flex items-center gap-2">
            {currentPlan === "YEARLY" && (
              <span className="inline-block w-fit rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                Your current plan
              </span>
            )}
            <span className="inline-block w-fit rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
              2 months free
            </span>
          </div>
          <h2 className="text-lg font-semibold">Yearly</h2>
          <p className="mt-1 text-2xl font-semibold">
            {yearlyPrice}
            <span className="text-sm font-normal text-neutral-500"> / year</span>
          </p>
          <p className="text-xs text-neutral-500">≈ {yearlyMonthlyEquivalent} / month</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Check>Everything in Free, plus:</Check>
            <Check>Unlimited interest — pursue as many people as you want</Check>
            <Check>Unlimited messaging</Check>
            <Check>Free entry to every paid event</Check>
            <Check>Free refreshments at every event</Check>
          </ul>
          <div className="mt-4">
            {currentPlan === "YEARLY" ? (
              <p className="text-xs text-neutral-400">
                Active until{" "}
                {subscription!.expiresAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                .
              </p>
            ) : (
              <SubscribeRequestButton plan="YEARLY" />
            )}
          </div>
        </div>
      </div>

      {subscription?.isActive && (
        <p className="mt-6 text-center text-xs text-neutral-500">
          Contact us if you&apos;d like to change or cancel your plan.
        </p>
      )}
    </div>
  );
}
