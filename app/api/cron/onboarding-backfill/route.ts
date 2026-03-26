import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

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

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") !== "false";
  const sendNow = url.searchParams.get("send_now") === "true";
  const supabase = createAdminClient();

  const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const verifiedUsers = (users?.users ?? []).filter((u) => !!u.email && !!u.email_confirmed_at);
  const userIds = verifiedUsers.map((u) => u.id);

  const { data: existing } = await supabase
    .from("onboarding_email_sequences")
    .select("user_id")
    .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  const existingSet = new Set((existing ?? []).map((row) => row.user_id as string));
  const toEnroll = verifiedUsers.filter((u) => !existingSet.has(u.id));

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      verified_users: verifiedUsers.length,
      already_enrolled: existingSet.size,
      will_enroll: toEnroll.length,
    });
  }

  const enrolled: { id: string; email: string }[] = [];
  for (const u of toEnroll) {
    const { data: created } = await supabase
      .from("onboarding_email_sequences")
      .insert({
        user_id: u.id,
        email: u.email!,
        status: "active",
        source: "backfill",
      })
      .select("id, email")
      .single();
    if (created?.id && created?.email) {
      enrolled.push({ id: created.id as string, email: created.email as string });
    }
  }

  const now = Date.now();
  const steps = [
    { step_key: "welcome_0h", template_key: "welcome", delayHours: 0 },
    { step_key: "setup_smtp_1d", template_key: "setup_smtp", delayHours: 24 },
    { step_key: "first_pitch_3d", template_key: "first_pitch", delayHours: 72 },
    { step_key: "follow_up_7d", template_key: "follow_up", delayHours: 168 },
  ];

  let eventsQueued = 0;
  for (const u of toEnroll) {
    const seq = enrolled.find((e) => e.email === u.email);
    if (!seq?.id) continue;
    const events = steps.map((step) => ({
      sequence_id: seq.id,
      user_id: u.id,
      recipient_email: u.email!,
      step_key: step.step_key,
      template_key: step.template_key,
      scheduled_at: new Date(now + (sendNow ? 0 : step.delayHours * 60 * 60 * 1000)).toISOString(),
      status: "pending",
      idempotency_key: `${u.id}:${step.step_key}`,
    }));
    const { error } = await supabase.from("onboarding_email_events").upsert(events, { onConflict: "idempotency_key" });
    if (!error) eventsQueued += events.length;
  }

  return NextResponse.json({
    ok: true,
    dry_run: false,
    enrolled: enrolled.length,
    events_queued: eventsQueued,
  });
}
