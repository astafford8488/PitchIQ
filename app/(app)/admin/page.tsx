import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  email: string | null;
  created_at: string;
  full_name: string | null;
  billing_tier: string | null;
  stripe_subscription_status: string | null;
  onboarding_completed_at: string | null;
  from_email: string | null;
};

export default async function AdminDashboardPage() {
  const admin = createAdminClient();
  const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = authData?.users ?? [];
  const ids = users.map((u) => u.id);

  const { data: profiles } = ids.length > 0
    ? await admin.from("profiles").select("id, full_name, billing_tier, stripe_subscription_status, onboarding_completed_at, from_email").in("id", ids)
    : { data: [] as { id: string; full_name: string | null; billing_tier: string | null; stripe_subscription_status: string | null; onboarding_completed_at: string | null; from_email: string | null }[] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows: UserRow[] = users.map((u) => {
    const p = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at ?? "",
      full_name: p?.full_name ?? null,
      billing_tier: p?.billing_tier ?? null,
      stripe_subscription_status: p?.stripe_subscription_status ?? null,
      onboarding_completed_at: p?.onboarding_completed_at ?? null,
      from_email: p?.from_email ?? null,
    };
  });

  return (
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
              <th className="text-left p-3 font-medium">Onboarding</th>
              <th className="text-left p-3 font-medium">From email</th>
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
                <td className="p-3">{r.onboarding_completed_at ? "Yes" : "No"}</td>
                <td className="p-3">{r.from_email ? "Set" : "—"}</td>
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
  );
}
