import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Normalize email for matching: lowercase, trim. */
function norm(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * Inbound reply webhook. Call when a podcast host replies to a pitch.
 * Use with Cloudflare Email Workers, Resend Inbound, or any service that can
 * POST here with sender + recipient.
 *
 * Auth: Bearer INBOUND_REPLY_SECRET or header X-Inbound-Secret.
 * Body (JSON): { from: string, to: string, subject?: string }
 * Or headers: Email-From, Email-To (e.g. from Cloudflare Worker).
 */
export async function POST(request: Request) {
  const secret = process.env.INBOUND_REPLY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-inbound-secret");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : headerSecret;
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let from: string;
  let to: string;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      from = (body.from ?? body["email-from"] ?? "").trim();
      to = (body.to ?? body["email-to"] ?? "").trim();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  } else {
    from = (request.headers.get("email-from") ?? request.headers.get("from") ?? "").trim();
    to = (request.headers.get("email-to") ?? request.headers.get("to") ?? "").trim();
  }

  if (!from || !to || !from.includes("@") || !to.includes("@")) {
    return NextResponse.json(
      { error: "Missing or invalid from/to. Send JSON { from, to } or headers Email-From, Email-To." },
      { status: 400 }
    );
  }

  const fromNorm = norm(from);
  const toNorm = norm(to);

  const supabase = createAdminClient();

  // Option A: Reply-To was replies+<pitch.id>@domain — extract pitch id and update directly
  const plusMatch = toNorm.match(/^replies\+([0-9a-f-]{36})@/);
  if (plusMatch) {
    const pitchId = plusMatch[1];
    const { data: pitchRow, error: fetchErr } = await supabase
      .from("pitches")
      .select("id, status")
      .eq("id", pitchId)
      .single();
    if (!fetchErr && pitchRow && (pitchRow as { status?: string }).status === "no_response") {
      const { error: updateErr } = await supabase
        .from("pitches")
        .update({ status: "interested", updated_at: new Date().toISOString() })
        .eq("id", pitchId);
      if (!updateErr) {
        return NextResponse.json({ ok: true, matched: true, pitch_id: pitchId, status: "interested" });
      }
    }
    return NextResponse.json({ ok: true, matched: false, message: "Pitch not found or already replied" });
  }

  // Option B: Match by from (host) + to (user's reply-to email)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, from_email")
    .not("from_email", "is", null);

  const userIds = (profiles ?? [])
    .filter((p) => norm((p as { from_email?: string }).from_email) === toNorm)
    .map((p) => p.id);

  if (userIds.length === 0) {
    return NextResponse.json({ ok: true, matched: false, message: "No profile with this reply-to email" });
  }

  // Find podcast(s) with this host_email (the replier).
  const { data: podcasts } = await supabase
    .from("podcasts")
    .select("id, host_email");

  const podcastIds = (podcasts ?? [])
    .filter((p) => norm((p as { host_email?: string }).host_email) === fromNorm)
    .map((p) => p.id);

  if (podcastIds.length === 0) {
    return NextResponse.json({ ok: true, matched: false, message: "No podcast with this host email" });
  }

  // Most recent sent pitch for any of these user+podcast pairs, status no_response.
  const { data: pitch } = await supabase
    .from("pitches")
    .select("id, user_id, podcast_id")
    .in("user_id", userIds)
    .in("podcast_id", podcastIds)
    .eq("status", "no_response")
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: false })
    .limit(1)
    .single();

  if (!pitch) {
    return NextResponse.json({ ok: true, matched: false, message: "No matching pitch with no_response" });
  }

  const { error } = await supabase
    .from("pitches")
    .update({ status: "interested", updated_at: new Date().toISOString() })
    .eq("id", pitch.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, matched: true, pitch_id: pitch.id, status: "interested" });
}
