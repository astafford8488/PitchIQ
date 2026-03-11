import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getSearchLimit } from "@/lib/billing";

export const dynamic = "force-dynamic";

const LISTEN_NOTES_BASE = "https://listen-api.listennotes.com/api/v2";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.LISTEN_NOTES_API_KEY;
  if (!key) return NextResponse.json({ error: "Listen Notes API key not configured" }, { status: 503 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Podcast id required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at, stripe_subscription_status, billing_tier, from_email, smtp_server")
    .eq("id", user.id)
    .single();

  const isActive = profile?.stripe_subscription_status === "active";
  const tier = isActive ? (profile?.billing_tier ?? "starter") : "free";
  if (!profile?.onboarding_completed_at) {
    return NextResponse.json({ error: "Complete your profile in Settings before searching." }, { status: 402 });
  }
  if (!isActive) {
    return NextResponse.json({ error: "An active subscription is required to search. Subscribe in Billing." }, { status: 402 });
  }
  if (!profile?.from_email?.trim() || !profile?.smtp_server?.trim()) {
    return NextResponse.json({ error: "Set up your email (From address and SMTP) in Settings before searching." }, { status: 402 });
  }

  const usageDate = todayUtc();
  const { data: usageRow } = await supabase
    .from("search_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("usage_date", usageDate)
    .maybeSingle();
  const used = usageRow?.count ?? 0;
  const limit = getSearchLimit(tier);
  if (used >= limit) {
    return NextResponse.json(
      { error: `Daily search limit reached (${limit} per day). Resets at midnight UTC. Upgrade for more.` },
      { status: 429 }
    );
  }

  const res = await fetch(`${LISTEN_NOTES_BASE}/podcasts/${encodeURIComponent(id)}`, {
    headers: { "X-ListenAPI-Key": key },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    if (res.status === 404) return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
    return NextResponse.json(
      { error: res.status === 429 ? "Rate limit exceeded" : "Listen Notes request failed" },
      { status: res.status === 429 ? 429 : 502 }
    );
  }

  const data = await res.json();

  await supabase.from("search_usage").upsert(
    { user_id: user.id, usage_date: usageDate, count: used + 1 },
    { onConflict: "user_id,usage_date" }
  );

  return NextResponse.json(data);
}
