import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getPitchLimit } from "@/lib/billing";

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

  const { podcast_id, subject, body, base_url: clientBaseUrl, template_id } = await request.json();
  if (!podcast_id) return NextResponse.json({ error: "podcast_id required" }, { status: 400 });

  const sub = (subject ?? "").trim() || "Podcast guest pitch";
  const text = (body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Pitch body is required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, smtp_server, smtp_port, smtp_security, smtp_username, smtp_password, from_email, sending_tier, billing_tier, stripe_subscription_status")
    .eq("id", user.id)
    .single();

  const hasSmtp = !!profile?.smtp_server?.trim();
  const hasFromEmail = !!profile?.from_email?.trim();
  const useManaged =
    profile?.sending_tier === "managed" ||
    (!hasSmtp && hasFromEmail);

  if (useManaged) {
    if (!hasFromEmail) {
      return NextResponse.json(
        { error: "Add your reply-to email in Settings (Email setup → PitchIQ-managed) and click Save." },
        { status: 400 }
      );
    }
  } else if (!hasFromEmail || !hasSmtp) {
    return NextResponse.json(
      { error: "Configure SMTP and From email in Settings before sending pitches." },
      { status: 400 }
    );
  }

  const tier = profile?.stripe_subscription_status === "active" ? (profile?.billing_tier ?? "starter") : "free";
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count: usedCount } = await supabase
    .from("pitches")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", monthStart.toISOString());
  const used = usedCount ?? 0;
  const limit = getPitchLimit(tier);
  if (used >= limit) {
    return NextResponse.json(
      { error: `Monthly pitch limit reached (${limit}). Upgrade for more.` },
      { status: 429 }
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

  const sentAt = new Date().toISOString();
  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    podcast_id,
    subject: sub,
    body: text,
    sent_at: sentAt,
    status: "no_response",
  };
  if (template_id) insertPayload.template_id = template_id;

  const { data: pitch, error: insertErr } = await supabase
    .from("pitches")
    .insert(insertPayload)
    .select("id")
    .single();
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  if (template_id) {
    const { data: tmpl } = await supabase.from("pitch_templates").select("usage_count").eq("id", template_id).single();
    await supabase
      .from("pitch_templates")
      .update({ usage_count: (tmpl?.usage_count ?? 0) + 1, updated_at: sentAt })
      .eq("id", template_id);
  }

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
  const clickBase = baseUrl && pitch?.id ? `${baseUrl.replace(/\/$/, "")}/api/track/click?p=${pitch.id}&u=` : "";
  const htmlContent = text.replace(/\n/g, "<br>");
  const htmlWithLinks = clickBase
    ? htmlContent.replace(
        /(https?:\/\/[^\s<]+)/g,
        (url: string) => `<a href="${clickBase}${encodeURIComponent(url)}">${url}</a>`
      )
    : htmlContent;
  const htmlBody = openTrackUrl
    ? `${htmlWithLinks}<br><img src="${openTrackUrl}" width="1" height="1" alt="" />`
    : undefined;

  const replyTo = profile?.from_email?.trim() ?? "";
  if (!replyTo || !replyTo.includes("@")) {
    await supabase.from("pitches").delete().eq("id", pitch.id);
    return NextResponse.json(
      { error: "Your reply-to email in Settings is missing or invalid." },
      { status: 400 }
    );
  }

  try {
    if (useManaged) {
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) {
        await supabase.from("pitches").delete().eq("id", pitch.id);
        return NextResponse.json({ error: "PitchIQ-managed sending is not configured." }, { status: 500 });
      }
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      const fromName = profile.full_name?.trim() || "Podcast Guest";
      const { error: resendErr } = await resend.emails.send({
        from: `${fromName} <pitches@pitchiq.live>`,
        to: toAddress,
        replyTo: replyTo,
        subject: sub,
        html: htmlBody ?? text.replace(/\n/g, "<br>"),
        text,
      });
      if (resendErr) {
        await supabase.from("pitches").delete().eq("id", pitch.id);
        return NextResponse.json({ error: resendErr.message ?? "Failed to send email" }, { status: 500 });
      }
    } else {
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
      await transporter.sendMail({
        from: replyTo,
        to: toAddress,
        subject: sub,
        text,
        ...(htmlBody && { html: htmlBody }),
      });
    }
  } catch (err) {
    await supabase.from("pitches").delete().eq("id", pitch.id);
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await supabase.from("target_list").delete().eq("user_id", user.id).eq("podcast_id", podcast_id);

  return NextResponse.json({ ok: true });
}
