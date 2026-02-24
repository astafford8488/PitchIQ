import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PER_RUN = 30;

function normalizeSmtpHost(host: string): string {
  const h = host.trim().toLowerCase();
  if (h === "smpt.gmail.com") return "smtp.gmail.com";
  return host.trim();
}

function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7) === secret;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

function buildFallbackFollowUp(
  hostName: string | null,
  podcastTitle: string,
  senderName: string
) {
  const greeting = hostName ? `Hi ${hostName},` : "Hi,";
  return `${greeting}\n\nI reached out last week about being a guest on ${podcastTitle} and wanted to follow up in case it got buried. I’d still love to connect if you’re open to it.\n\nBest,\n${senderName}`;
}

export async function GET(request: Request) {
  return runFollowUps(request);
}

export async function POST(request: Request) {
  return runFollowUps(request);
}

async function runFollowUps(request: Request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  const { data: pitches } = await supabase
    .from("pitches")
    .select("id, user_id, podcast_id, subject, body")
    .not("sent_at", "is", null)
    .lt("sent_at", cutoff)
    .eq("status", "no_response")
    .eq("follow_ups_sent", 0)
    .limit(MAX_PER_RUN)
    .order("sent_at", { ascending: true });

  if (!pitches?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  let sent = 0;
  const errors: string[] = [];

  for (const pitch of pitches) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, smtp_server, smtp_port, smtp_security, smtp_username, smtp_password, from_email")
      .eq("id", pitch.user_id)
      .single();

    if (!profile?.from_email?.trim() || !profile?.smtp_server?.trim()) {
      errors.push(`Pitch ${pitch.id}: user has no SMTP`);
      continue;
    }

    const { data: podcast } = await supabase
      .from("podcasts")
      .select("host_email, host_name, title")
      .eq("id", pitch.podcast_id)
      .single();

    if (!podcast?.host_email?.trim()) {
      errors.push(`Pitch ${pitch.id}: no host email`);
      continue;
    }

    const name =
      profile.full_name?.trim() ||
      "Guest";
    const subject = pitch.subject?.startsWith("Re:")
      ? pitch.subject
      : `Re: ${pitch.subject || "Guest pitch"}`;

    let body: string;
    if (openaiKey) {
      try {
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({ apiKey: openaiKey });
        const comp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `Write a very short email (2-4 sentences) for someone following up on a podcast guest pitch they sent one week ago. Be polite and brief. Do not repeat the original pitch. Reference that they reached out last week. Use first person. End with "Best," then a newline then the sender's name: "${name}". Original pitch subject: ${pitch.subject ?? "guest pitch"}. Podcast: ${podcast.title}. Host name: ${podcast.host_name ?? "Host"}. Output ONLY the email body, no subject.`,
            },
          ],
          max_tokens: 200,
        });
        body = comp.choices[0]?.message?.content?.trim() ?? buildFallbackFollowUp(podcast.host_name, podcast.title, name);
      } catch {
        body = buildFallbackFollowUp(podcast.host_name, podcast.title, name);
      }
    } else {
      body = buildFallbackFollowUp(podcast.host_name, podcast.title, name);
    }

    const portNum = profile.smtp_port ? Number(profile.smtp_port) : 587;
    const secure = portNum === 465 || profile.smtp_security === "TLS";
    const transporter = nodemailer.createTransport({
      host: normalizeSmtpHost(profile.smtp_server),
      port: portNum,
      secure,
      auth:
        profile.smtp_username?.trim() && profile.smtp_password
          ? { user: profile.smtp_username.trim(), pass: profile.smtp_password }
          : undefined,
      ...(portNum === 587 && profile.smtp_security !== "None" && !secure
        ? { requireTLS: true }
        : {}),
    });

    try {
      await transporter.sendMail({
        from: profile.from_email.trim(),
        to: podcast.host_email.trim(),
        subject,
        text: body,
      });
    } catch (err) {
      errors.push(`Pitch ${pitch.id}: ${err instanceof Error ? err.message : "Send failed"}`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from("pitches")
      .update({
        follow_ups_sent: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pitch.id);

    if (updateErr) {
      errors.push(`Pitch ${pitch.id}: ${updateErr.message}`);
    } else {
      sent++;
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    total_eligible: pitches!.length,
    errors: errors.length ? errors : undefined,
  });
}
