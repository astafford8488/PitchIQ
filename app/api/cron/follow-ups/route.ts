import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

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

const TONE_PROMPTS: Record<string, string> = {
  friendly:
    "Warm and personable. Light, conversational. Use casual language but stay respectful. Mention you understand they're busy.",
  professional:
    "Polished and formal. Concise. Use proper salutations and sign-off. No slang. Business-appropriate.",
  brief:
    "Very short—2 sentences max. Get to the point. No fluff. Just a quick nudge.",
};

function buildFallbackFollowUp(
  hostName: string | null,
  podcastTitle: string,
  senderName: string,
  tone = "friendly",
  isFinal = false
) {
  const greeting = hostName ? `Hi ${hostName},` : "Hi,";
  const friendly = isFinal
    ? `I wanted to reach out one last time about guesting on ${podcastTitle}. No worries if timing isn't right—happy to connect another time.`
    : `I reached out last week about being a guest on ${podcastTitle} and wanted to follow up in case it got buried. I'd still love to connect if you're open to it.`;
  const professional = isFinal
    ? `Final follow-up regarding my guest pitch for ${podcastTitle}. I understand you may be busy—please don't hesitate to reach out if your schedule opens up.`
    : `I'm following up on my previous outreach regarding a potential guest appearance on ${podcastTitle}. I remain interested and would appreciate the opportunity to discuss further.`;
  const brief = isFinal
    ? `Last quick note on ${podcastTitle}—open to connecting whenever works for you.`
    : `Quick follow-up on my pitch for ${podcastTitle}—still interested in connecting when you have a moment.`;
  const bodies: Record<string, string> = { friendly, professional, brief };
  const body = bodies[tone] ?? bodies.friendly;
  return `${greeting}\n\n${body}\n\nBest,\n${senderName}`;
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

  const { data: pitches } = await supabase
    .from("pitches")
    .select("id, user_id, podcast_id, subject, body, sent_at, follow_ups_sent, follow_up_last_sent_at")
    .not("sent_at", "is", null)
    .eq("status", "no_response")
    .lt("follow_ups_sent", 3)
    .limit(MAX_PER_RUN * 2)
    .order("sent_at", { ascending: true });

  if (!pitches?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  let sent = 0;
  const errors: string[] = [];

  for (const pitch of pitches) {
    if (sent >= MAX_PER_RUN) break;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, smtp_server, smtp_port, smtp_security, smtp_username, smtp_password, from_email, follow_up_days, follow_up_tone, max_follow_ups")
      .eq("id", pitch.user_id)
      .single();

    const maxFollowUps = profile?.max_follow_ups ?? 1;
    const count = pitch.follow_ups_sent ?? 0;
    if (count >= maxFollowUps) continue;

    const daysMs = (profile?.follow_up_days ?? 7) * 24 * 60 * 60 * 1000;
    const refDate = count === 0 ? pitch.sent_at : pitch.follow_up_last_sent_at;
    const cutoff = new Date(Date.now() - daysMs).toISOString();
    if (!refDate || refDate >= cutoff) continue;

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
    const tone = profile?.follow_up_tone ?? "friendly";
    const subject = pitch.subject?.startsWith("Re:")
      ? pitch.subject
      : `Re: ${pitch.subject || "Guest pitch"}`;

    const toneInstruction = TONE_PROMPTS[tone] ?? TONE_PROMPTS.friendly;
    const stepNum = count + 1;
    const sequenceContext =
      stepNum === 1
        ? "first follow-up (they reached out about a week ago)"
        : stepNum === maxFollowUps
          ? `final follow-up (#${stepNum})—soft close, no pressure`
          : `follow-up #${stepNum} of ${maxFollowUps}`;

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
              content: `Write a very short email (2-4 sentences) for someone doing a ${sequenceContext} on a podcast guest pitch. Tone: ${toneInstruction}. Do not repeat the original pitch. Use first person. End with "Best," then a newline then the sender's name: "${name}". Original pitch subject: ${pitch.subject ?? "guest pitch"}. Podcast: ${podcast.title}. Host name: ${podcast.host_name ?? "Host"}. Output ONLY the email body, no subject.`,
            },
          ],
          max_tokens: 200,
        });
        const isFinal = stepNum === maxFollowUps;
        body = comp.choices[0]?.message?.content?.trim() ?? buildFallbackFollowUp(podcast.host_name, podcast.title, name, tone, isFinal);
      } catch {
        body = buildFallbackFollowUp(podcast.host_name, podcast.title, name, tone, stepNum === maxFollowUps);
      }
    } else {
      body = buildFallbackFollowUp(podcast.host_name, podcast.title, name, tone, stepNum === maxFollowUps);
    }

    try {
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

    const newCount = (pitch.follow_ups_sent ?? 0) + 1;
    const { error: updateErr } = await supabase
      .from("pitches")
      .update({
        follow_ups_sent: newCount,
        follow_up_last_sent_at: new Date().toISOString(),
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
