import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  getAppUrlFromEnv,
  renderOnboardingTemplate,
  type OnboardingTemplateKey,
} from "@/lib/onboarding-email-templates";

export const dynamic = "force-dynamic";

const MAX_PER_RUN = 50;

function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7) === secret;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

async function run(request: Request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
  }

  const fromEmail = process.env.ONBOARDING_EMAIL_FROM?.trim() || process.env.RESEND_FROM_EMAIL?.trim() || "PitchIQ <admin@pitchiq.live>";
  const resend = new Resend(resendKey);
  const supabase = createAdminClient();
  const appUrl = getAppUrlFromEnv();

  const { data: events, error } = await supabase
    .from("onboarding_email_events")
    .select("id, user_id, recipient_email, template_key, attempts")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!events?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];
  for (const event of events) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, onboarding_emails_enabled, unsubscribed_at")
      .eq("id", event.user_id)
      .maybeSingle();

    if (profile?.unsubscribed_at || profile?.onboarding_emails_enabled === false) {
      await supabase
        .from("onboarding_email_events")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", event.id);
      continue;
    }

    const email = String(event.recipient_email ?? "").trim();
    if (!email) {
      await supabase
        .from("onboarding_email_events")
        .update({
          status: "failed",
          attempts: (event.attempts ?? 0) + 1,
          last_error: "Missing recipient email",
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      continue;
    }

    const key = String(event.template_key ?? "welcome") as OnboardingTemplateKey;
    const { subject, html } = renderOnboardingTemplate(key, profile?.full_name ?? null, appUrl);
    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject,
        html,
      });
      const messageId = "data" in result ? result.data?.id ?? null : null;
      await supabase
        .from("onboarding_email_events")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          last_event_type: "email.sent",
          resend_message_id: messageId,
          attempts: (event.attempts ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      sent += 1;
    } catch (err) {
      const attempts = (event.attempts ?? 0) + 1;
      const retryHours = attempts <= 2 ? 1 : 6;
      const nextStatus = attempts >= 4 ? "failed" : "pending";
      await supabase
        .from("onboarding_email_events")
        .update({
          status: nextStatus,
          attempts,
          scheduled_at: new Date(Date.now() + retryHours * 60 * 60 * 1000).toISOString(),
          last_error: err instanceof Error ? err.message : "Resend send failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      errors.push(`event ${event.id}: ${err instanceof Error ? err.message : "send failed"}`);
    }
  }

  return NextResponse.json({ ok: true, sent, total: events.length, errors: errors.length ? errors : undefined });
}
