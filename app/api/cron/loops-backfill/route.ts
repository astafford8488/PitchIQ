import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isLoopsOnboardingEnabled, syncVerifiedUserToLoops } from "@/lib/loops";

export const dynamic = "force-dynamic";

function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7) === secret;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function POST(request: Request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isLoopsOnboardingEnabled()) {
    return NextResponse.json({ error: "LOOPS_ONBOARDING_ENABLED is false" }, { status: 400 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") !== "false";
  const admin = createAdminClient();
  const { data: users, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const verifiedUsers = (users?.users ?? []).filter((u) => !!u.email && !!u.email_confirmed_at);
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      verified_users: verifiedUsers.length,
      will_sync: verifiedUsers.length,
    });
  }

  let synced = 0;
  const errors: string[] = [];
  for (const u of verifiedUsers) {
    const { data: profile } = await admin.from("profiles").select("full_name").eq("id", u.id).maybeSingle();
    const res = await syncVerifiedUserToLoops({
      userId: u.id,
      email: u.email!,
      fullName: profile?.full_name ?? null,
      verifiedAt: u.email_confirmed_at,
    });
    if (res.ok) synced += 1;
    else errors.push(`${u.email}: ${res.message ?? "sync failed"}`);
  }

  return NextResponse.json({
    ok: true,
    dry_run: false,
    verified_users: verifiedUsers.length,
    synced,
    errors: errors.length ? errors : undefined,
  });
}
