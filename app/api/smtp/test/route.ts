import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

function normalizeSmtpHost(host: string): string {
  const h = host.trim().toLowerCase();
  if (h === "smpt.gmail.com") return "smtp.gmail.com";
  return host.trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      smtp_server,
      port,
      security,
      username,
      password,
      from_email,
      to_email,
    } = body;

    if (!smtp_server?.trim() || !from_email?.trim() || !to_email?.trim()) {
      return NextResponse.json(
        { error: "SMTP server, From email, and To email are required" },
        { status: 400 }
      );
    }

    const portNum = port ? Number(port) : 587;
    const secure = portNum === 465 || security === "TLS";
    const host = normalizeSmtpHost(smtp_server);
    const transporter = nodemailer.createTransport({
      host,
      port: portNum,
      secure,
      auth:
        username?.trim() && password
          ? { user: username.trim(), pass: password }
          : undefined,
      ...(portNum === 587 && security !== "None" && !secure
        ? { requireTLS: true }
        : {}),
    });

    await transporter.sendMail({
      from: from_email.trim(),
      to: to_email.trim(),
      subject: "Podcast Pitch — test email",
      text: "This is a test email from your Podcast Pitch SMTP settings. If you received this, your configuration is working.",
    });

    return NextResponse.json({ ok: true, message: "Test email sent" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send test email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
