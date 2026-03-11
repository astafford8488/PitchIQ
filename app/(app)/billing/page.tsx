import { createClient } from "@/lib/supabase/server";
import { SubscribeButton } from "../dashboard/SubscribeButton";
import { TIER_LIMITS, SEARCH_LIMITS } from "@/lib/billing";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_status, billing_tier")
    .eq("id", user.id)
    .single();
  const isSubscribed = profile?.stripe_subscription_status === "active";
  const currentTier = profile?.billing_tier ?? "free";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Billing</h1>
      <p className="text-[var(--muted)] mb-6">Manage your subscription and pitch limits.</p>

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          {
            tier: "starter" as const,
            name: "Starter",
            price: "$29.99",
            limit: TIER_LIMITS.starter,
            features: [
              `${SEARCH_LIMITS.starter} database searches per day`,
              "Access to our huge podcast & media database",
              "AI-crafted pitches with customizable templates",
              "AI profile feedback to strengthen your pitch",
              "Open & click tracking + auto follow-ups",
            ],
          },
          {
            tier: "growth" as const,
            name: "Growth",
            price: "$49.99",
            limit: TIER_LIMITS.growth,
            features: [
              `${SEARCH_LIMITS.growth} database searches per day`,
              "Everything in Starter",
              "2× pitch volume for more outreach",
              "Full discovery & target list tools",
              "Tracking, follow-ups & AI templates",
            ],
          },
          {
            tier: "platinum" as const,
            name: "Platinum",
            price: "$99.99",
            limit: TIER_LIMITS.platinum,
            features: [
              `${SEARCH_LIMITS.platinum} database searches per day`,
              "Everything in Growth",
              "Maximum pitch volume for serious scale",
              "Huge database, AI profile & templates",
              "Full tracking & auto follow-ups",
            ],
          },
        ].map((plan) => {
          const isCurrent = isSubscribed && (currentTier === plan.tier || (plan.tier === "growth" && currentTier === "pro"));
          return (
            <div
              key={plan.tier}
              className={`rounded-lg p-6 flex flex-col ${
                isCurrent
                  ? "border-2 border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              {isCurrent && (
                <span className="inline-block text-xs font-semibold text-[var(--accent)] uppercase tracking-wide mb-2">
                  Current plan
                </span>
              )}
              <h2 className="text-lg font-semibold mb-1">{plan.name}</h2>
              <p className="text-2xl font-bold mb-1">{plan.price}<span className="text-sm font-normal text-[var(--muted)]">/month</span></p>
              <p className="text-[var(--muted)] text-sm mb-4">{plan.limit} pitches per month</p>
              <ul className="text-sm text-[var(--muted)] space-y-2 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <SubscribeButton
                isSubscribed={isCurrent}
                tier={plan.tier}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
