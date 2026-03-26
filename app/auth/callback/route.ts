import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/request-origin";
import {
  getOnboardingProvider,
  isLoopsOnboardingEnabled,
  syncVerifiedUserToLoops,
} from "@/lib/loops";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const origin = getRequestOrigin(request);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id && user.email && user.email_confirmed_at) {
        const provider = getOnboardingProvider();
        if (isLoopsOnboardingEnabled() && (provider === "loops" || provider === "both")) {
          try {
            const admin = createAdminClient();
            const { data: profile } = await admin
              .from("profiles")
              .select("full_name")
              .eq("id", user.id)
              .maybeSingle();
            await syncVerifiedUserToLoops({
              userId: user.id,
              email: user.email,
              fullName: profile?.full_name ?? null,
              verifiedAt: user.email_confirmed_at,
            });
          } catch {
            // Never block auth callback on Loops sync failures.
          }
        }

        try {
          if (provider === "internal" || provider === "both") {
            await enrollOnboardingSequence(user.id, user.email);
          }
        } catch {
          // Never block auth callback on onboarding sequence failures.
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}

async function enrollOnboardingSequence(userId: string, email: string) {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("onboarding_emails_enabled, unsubscribed_at")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.unsubscribed_at || profile?.onboarding_emails_enabled === false) {
    return;
  }

  const { data: existing } = await admin
    .from("onboarding_email_sequences")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let sequenceId = existing?.id as string | undefined;
  if (!sequenceId) {
    const { data: created } = await admin
      .from("onboarding_email_sequences")
      .insert({
        user_id: userId,
        email,
        status: "active",
        source: "auth_callback",
      })
      .select("id")
      .single();
    sequenceId = created?.id as string | undefined;
  }
  if (!sequenceId) return;

  const now = Date.now();
  const steps = [
    { step_key: "welcome_0h", template_key: "welcome", delayHours: 0 },
    { step_key: "setup_smtp_1d", template_key: "setup_smtp", delayHours: 24 },
    { step_key: "first_pitch_3d", template_key: "first_pitch", delayHours: 72 },
    { step_key: "follow_up_7d", template_key: "follow_up", delayHours: 168 },
  ];

  const events = steps.map((step) => ({
    sequence_id: sequenceId,
    user_id: userId,
    recipient_email: email,
    step_key: step.step_key,
    template_key: step.template_key,
    scheduled_at: new Date(now + step.delayHours * 60 * 60 * 1000).toISOString(),
    status: "pending",
    idempotency_key: `${userId}:${step.step_key}`,
  }));

  await admin.from("onboarding_email_events").upsert(events, { onConflict: "idempotency_key" });
}
