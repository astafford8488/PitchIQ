import { createClient } from "@/lib/supabase/server";
import { SubscribeButton } from "../dashboard/SubscribeButton";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("stripe_subscription_status").eq("id", user.id).single();
  const isSubscribed = profile?.stripe_subscription_status === "active";

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Billing</h1>
      <p className="text-[var(--muted)] mb-6">Manage your subscription.</p>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Subscription</h2>
        {isSubscribed ? (
          <p className="text-[var(--muted)] text-sm mb-4">You have an active subscription. You can generate pitches and use all features.</p>
        ) : (
          <p className="text-[var(--muted)] text-sm mb-4">Subscribe to unlock pitch generation and full access.</p>
        )}
        <div className="flex items-center gap-4 flex-wrap">
          <SubscribeButton isSubscribed={isSubscribed} />
        </div>
      </div>
    </div>
  );
}
