import { createAdminClient } from "@/lib/supabase/admin";
import { getPitchLimit } from "@/lib/billing";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  billing_tier: string | null;
  stripe_subscription_status: string | null;
  onboarding_completed_at: string | null;
  from_email: string | null;
  pitches_this_month: number;
};

function monthStartUtc(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function AdminDashboardPage() {
  const admin = createAdminClient();
  const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = authData?.users ?? [];
  const ids = users.map((u) => u.id);

  const monthStart = monthStartUtc();

  const [profilesRes, pitchesRes] = await Promise.all([
    ids.length > 0
      ? admin.from("profiles").select("id, full_name, billing_tier, stripe_subscription_status, onboarding_completed_at, from_email").in("id", ids)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; billing_tier: string | null; stripe_subscription_status: string | null; onboarding_completed_at: string | null; from_email: string | null }[] }),
    admin.from("pitches").select("user_id").gte("created_at", monthStart),
  ]);

  const profiles = profilesRes.data ?? [];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const pitchCountByUser = new Map<string, number>();
  for (const row of pitchesRes.data ?? []) {
    const uid = (row as { user_id?: string }).user_id;
    if (uid) pitchCountByUser.set(uid, (pitchCountByUser.get(uid) ?? 0) + 1);
  }

  const rows: UserRow[] = users.map((u) => {
    const p = profileMap.get(u.id);
    const used = pitchCountByUser.get(u.id) ?? 0;
    return {
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at ?? "",
      last_sign_in_at: (u as { last_sign_in_at?: string | null }).last_sign_in_at ?? null,
      full_name: p?.full_name ?? null,
      billing_tier: p?.billing_tier ?? null,
      stripe_subscription_status: p?.stripe_subscription_status ?? null,
      onboarding_completed_at: p?.onboarding_completed_at ?? null,
      from_email: p?.from_email ?? null,
      pitches_this_month: used,
    };
  });

  const totalUsers = rows.length;
  const subscribers = rows.filter((r) => r.stripe_subscription_status === "active");
  const totalSubscriptions = subscribers.length;
  const tierLimit = (r: UserRow) => getPitchLimit(r.billing_tier);
  const usingPitches = subscribers.filter((r) => r.pitches_this_month > 0);
  const atLimit = subscribers.filter((r) => {
    const limit = tierLimit(r);
    return limit > 0 && r.pitches_this_month >= limit;
  });
  const pctUsing = totalSubscriptions > 0 ? Math.round((usingPitches.length / totalSubscriptions) * 100) : 0;
  const pctAtLimit = totalSubscriptions > 0 ? Math.round((atLimit.length / totalSubscriptions) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-[var(--muted)] text-sm">Total users</p>
          <p className="text-2xl font-semibold">{totalUsers}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-[var(--muted)] text-sm">Active subscriptions</p>
          <p className="text-2xl font-semibold">{totalSubscriptions}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-[var(--muted)] text-sm">Subscribers using pitches</p>
          <p className="text-2xl font-semibold">{pctUsing}%</p>
          <p className="text-xs text-[var(--muted)]">{usingPitches.length} of {totalSubscriptions}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-[var(--muted)] text-sm">Subscribers at pitch limit</p>
          <p className="text-2xl font-semibold">{pctAtLimit}%</p>
          <p className="text-xs text-[var(--muted)]">{atLimit.length} of {totalSubscriptions}</p>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b border-[var(--border)]">Users ({rows.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/30">
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Tier</th>
                <th className="text-left p-3 font-medium">Subscription</th>
                <th className="text-left p-3 font-medium">Pitches (month)</th>
                <th className="text-left p-3 font-medium">Onboarding</th>
                <th className="text-left p-3 font-medium">From email</th>
                <th className="text-left p-3 font-medium">Last login</th>
                <th className="text-left p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/20">
                  <td className="p-3">{r.email ?? "—"}</td>
                  <td className="p-3">{r.full_name ?? "—"}</td>
                  <td className="p-3">{r.billing_tier ?? "—"}</td>
                  <td className="p-3">{r.stripe_subscription_status ?? "—"}</td>
                  <td className="p-3">{r.pitches_this_month}</td>
                  <td className="p-3">{r.onboarding_completed_at ? "Yes" : "No"}</td>
                  <td className="p-3">{r.from_email ? "Set" : "—"}</td>
                  <td className="p-3 text-[var(--muted)]">
                    {r.last_sign_in_at ? new Date(r.last_sign_in_at).toLocaleString() : "Never"}
                  </td>
                  <td className="p-3 text-[var(--muted)]">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="p-6 text-[var(--muted)]">No users yet.</p>
        )}
      </div>
    </div>
  );
}
