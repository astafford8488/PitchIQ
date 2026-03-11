import { createClient } from "@/lib/supabase/server";
import { SubscribeButton } from "../dashboard/SubscribeButton";
import { TIER_LIMITS } from "@/lib/billing";

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

      {isSubscribed && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Current plan</h2>
          <p className="text-[var(--muted)] text-sm mb-4">
            You’re on <strong className="text-[var(--text)]">{currentTier === "platinum" ? "Platinum" : currentTier === "growth" || currentTier === "pro" ? "Growth" : "Starter"}</strong> — {TIER_LIMITS[currentTier] ?? 0} pitches per month.
          </p>
          <SubscribeButton isSubscribed={true} />
        </div>
      )}

      {!isSubscribed && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-1">Starter</h2>
            <p className="text-[var(--muted)] text-sm mb-1">$20 / month</p>
            <p className="text-[var(--muted)] text-sm mb-3">{TIER_LIMITS.starter} pitches</p>
            <SubscribeButton isSubscribed={false} tier="starter" />
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-1">Growth</h2>
            <p className="text-[var(--muted)] text-sm mb-1">$50 / month</p>
            <p className="text-[var(--muted)] text-sm mb-3">{TIER_LIMITS.growth} pitches</p>
            <SubscribeButton isSubscribed={false} tier="growth" />
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-1">Platinum</h2>
            <p className="text-[var(--muted)] text-sm mb-1">$100 / month</p>
            <p className="text-[var(--muted)] text-sm mb-3">{TIER_LIMITS.platinum} pitches</p>
            <SubscribeButton isSubscribed={false} tier="platinum" />
          </div>
        </div>
      )}
    </div>
  );
}
