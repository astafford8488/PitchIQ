import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

function normalizeSmtpHost(host: string): string {
  const h = host.trim().toLowerCase();
  if (h === "smpt.gmail.com") return "smtp.gmail.com";
  return host.trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { podcast_id, subject, body, base_url: clientBaseUrl } = await request.json();
  if (!podcast_id) return NextResponse.json({ error: "podcast_id required" }, { status: 400 });

  const sub = (subject ?? "").trim() || "Podcast guest pitch";
  const text = (body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Pitch body is required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("smtp_server, smtp_port, smtp_security, smtp_username, smtp_password, from_email")
    .eq("id", user.id)
    .single();

  if (!profile?.from_email?.trim() || !profile?.smtp_server?.trim()) {
    return NextResponse.json(
      { error: "Configure SMTP and From email in Profile before sending pitches." },
      { status: 400 }
    );
  }

  const { data: podcast } = await supabase
    .from("podcasts")
    .select("host_email, title")
    .eq("id", podcast_id)
    .single();

  if (!podcast) {
    return NextResponse.json(
      { error: "Podcast not found. It may have been removed." },
      { status: 400 }
    );
  }

  const toAddress = typeof podcast.host_email === "string" ? podcast.host_email.trim() : "";
  if (!toAddress || !toAddress.includes("@")) {
    return NextResponse.json(
      { error: "This podcast has no contact email on file. Add one or use the contact link instead." },
      { status: 400 }
    );
  }

  const portNum = profile.smtp_port ? Number(profile.smtp_port) : 587;
  const secure = portNum === 465 || profile.smtp_security === "TLS";
  const host = normalizeSmtpHost(profile.smtp_server);
  const transporter = nodemailer.createTransport({
    host,
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

  const sentAt = new Date().toISOString();
  const { data: pitch, error: insertErr } = await supabase
    .from("pitches")
    .insert({
      user_id: user.id,
      podcast_id,
      subject: sub,
      body: text,
      sent_at: sentAt,
      status: "no_response",
    })
    .select("id")
    .single();
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Use client origin for tracking URL so we don't need NEXT_PUBLIC_APP_URL (avoids Netlify build issues).
  const baseUrl =
    (typeof clientBaseUrl === "string" && clientBaseUrl.trim()) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    (process.env.URL ? process.env.URL.replace(/\/$/, "") : "") ||
    "";
  const openTrackUrl =
    baseUrl && pitch?.id
      ? `${baseUrl.replace(/\/$/, "")}/api/track/open?p=${pitch.id}`
      : "";
  const htmlBody = openTrackUrl
    ? `${text.replace(/\n/g, "<br>")}<br><img src="${openTrackUrl}" width="1" height="1" alt="" />`
    : undefined;

  const fromAddress = profile.from_email.trim();
  if (!fromAddress || !fromAddress.includes("@")) {
    await supabase.from("pitches").delete().eq("id", pitch.id);
    return NextResponse.json(
      { error: "Your From email in Settings is missing or invalid." },
      { status: 400 }
    );
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: toAddress,
      subject: sub,
      text,
      ...(htmlBody && { html: htmlBody }),
    });
  } catch (err) {
    await supabase.from("pitches").delete().eq("id", pitch.id);
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await supabase.from("target_list").delete().eq("user_id", user.id).eq("podcast_id", podcast_id);

  return NextResponse.json({ ok: true });
}
