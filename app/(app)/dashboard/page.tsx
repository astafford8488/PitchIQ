import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getPitchLimit, getUsageStats } from "@/lib/billing";
import { UpgradePrompt } from "@/components/UpgradePrompt";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("billing_tier, stripe_subscription_status")
    .eq("id", user.id)
    .single();
  const tier = profile?.stripe_subscription_status === "active" ? (profile?.billing_tier ?? "starter") : "free";
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count: usedCount } = await supabase
    .from("pitches")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", monthStart.toISOString());
  const usage = getUsageStats(usedCount ?? 0, tier);

  const { data: targetList } = await supabase.from("target_list").select("id").eq("user_id", user.id);
  const { data: allPitches } = await supabase
    .from("pitches")
    .select("id, status, sent_at, opened_at, follow_ups_sent")
    .eq("user_id", user.id);
  const { data: recentPitches } = await supabase
    .from("pitches")
    .select("id, status, created_at, podcasts(title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const sent = allPitches?.filter((p) => p.sent_at != null) ?? [];
  const sentCount = sent.length;
  const openedCount = sent.filter((p) => p.opened_at != null).length;
  const repliedStatuses = ["interested", "declined", "booked"];
  const repliedCount = sent.filter((p) => repliedStatuses.includes(p.status ?? "")).length;
  const followUpsTotal = sent.reduce((sum, p) => sum + (p.follow_ups_sent ?? 0), 0);
  const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;
  const replyRate = sentCount > 0 ? Math.round((repliedCount / sentCount) * 100) : 0;
  const booked = allPitches?.filter((p) => p.status === "booked")?.length ?? 0;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-[var(--muted)] mb-4">Overview of your podcast outreach.</p>

      {usage.nearLimit && (
        <UpgradePrompt
          used={usage.used}
          limit={usage.limit}
          isSubscribed={profile?.stripe_subscription_status === "active"}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-[var(--muted)] text-sm">Target list</p>
          <p className="text-2xl font-semibold">{targetList?.length ?? 0}</p>
          <Link href="/target-list" className="text-sm text-[var(--accent)] hover:underline mt-1 inline-block">View</Link>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-[var(--muted)] text-sm">Pitches sent</p>
          <p className="text-2xl font-semibold">{sentCount}</p>
          <Link href="/pitches" className="text-sm text-[var(--accent)] hover:underline mt-1 inline-block">View</Link>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-[var(--muted)] text-sm">Open rate</p>
          <p className="text-2xl font-semibold">{openRate}%</p>
          <p className="text-xs text-[var(--muted)]">{openedCount} of {sentCount} opened</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-[var(--muted)] text-sm">Reply rate</p>
          <p className="text-2xl font-semibold">{replyRate}%</p>
          <p className="text-xs text-[var(--muted)]">{repliedCount} of {sentCount} replied</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-[var(--muted)] text-sm">Follow-ups sent</p>
          <p className="text-2xl font-semibold">{followUpsTotal}</p>
          <p className="text-xs text-[var(--muted)]">AI follow-ups</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-[var(--muted)] text-sm">Booked</p>
          <p className="text-2xl font-semibold">{booked}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent pitches</h2>
        {recentPitches?.length ? (
          <ul className="space-y-2">
            {recentPitches.map((p) => (
              <li key={p.id} className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3">
                <span className="font-medium">{(Array.isArray(p.podcasts) ? p.podcasts[0] : p.podcasts)?.title ?? "Podcast"}</span>
                <span className="text-sm text-[var(--muted)] capitalize">{p.status.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--muted)]">No pitches yet. Add podcasts to your target list and generate pitches.</p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-4 items-center">
        <Link href="/discover" className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)]">Discover podcasts</Link>
        <Link href="/target-list" className="border border-[var(--border)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--surface)]">Target list</Link>
        <Link href="/billing" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">Subscription →</Link>
      </div>
    </div>
  );
}
