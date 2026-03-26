import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function checkWebhookSecret(request: Request): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7) === secret;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function POST(request: Request) {
  if (!checkWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { type?: string; data?: { email_id?: string; created_at?: string } }
    | null;
  if (!payload?.type || !payload?.data?.email_id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const eventType = payload.type;
  const messageId = payload.data.email_id;
  const eventTime = payload.data.created_at ?? new Date().toISOString();

  await supabase.from("resend_webhook_events").insert({
    provider: "resend",
    event_type: eventType,
    message_id: messageId,
    payload,
    received_at: new Date().toISOString(),
  });

  const updates: Record<string, unknown> = {
    last_event_type: eventType,
    updated_at: new Date().toISOString(),
  };
  if (eventType === "email.delivered") updates.delivered_at = eventTime;
  if (eventType === "email.bounced") updates.bounced_at = eventTime;
  if (eventType === "email.opened") updates.opened_at = eventTime;
  if (eventType === "email.clicked") updates.clicked_at = eventTime;

  await supabase.from("onboarding_email_events").update(updates).eq("resend_message_id", messageId);

  return NextResponse.json({ ok: true });
}
