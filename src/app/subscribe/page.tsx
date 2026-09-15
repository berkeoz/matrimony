import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSubscription } from "@/lib/subscription";
import SubscribeRequestButton from "@/components/SubscribeRequestButton";

export default async function SubscribePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const subscription = await getSubscription(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Subscribe</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        A subscription waives the fee on paid events and removes the free-tier limits on
        expressing interest and messaging.
      </p>

      <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        Online payments aren&apos;t set up yet. Requesting a plan below sends us a note — we&apos;ll
        reach out to arrange payment and then activate it on your account.
      </p>

      {subscription?.isActive ? (
        <div className="mt-8 rounded-2xl border border-black/10 p-6">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            You&apos;re subscribed ({subscription.plan === "MONTHLY" ? "Monthly" : "Yearly"})
          </p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Active until {subscription.expiresAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            . Contact us if you&apos;d like to change or cancel your plan.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/10 p-6">
            <h2 className="text-lg font-semibold">Monthly</h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Free event entry, unlimited interest, and unlimited messaging for one month.
            </p>
            <div className="mt-4">
              <SubscribeRequestButton plan="MONTHLY" />
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 p-6">
            <h2 className="text-lg font-semibold">Yearly</h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Free event entry, unlimited interest, and unlimited messaging for a full year.
            </p>
            <div className="mt-4">
              <SubscribeRequestButton plan="YEARLY" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
