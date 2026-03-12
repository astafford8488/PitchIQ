import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { generateAffiliateCode } from "@/lib/affiliate-code";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Application id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: app, error: fetchErr } = await admin
    .from("affiliate_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (app.status !== "pending") {
    return NextResponse.json({ error: "Application already reviewed" }, { status: 400 });
  }

  let code = generateAffiliateCode(8);
  for (let i = 0; i < 10; i++) {
    const { data: existing } = await admin.from("affiliates").select("id").eq("affiliate_code", code).maybeSingle();
    if (!existing) break;
    code = generateAffiliateCode(8);
  }

  const { error: insertErr } = await admin.from("affiliates").insert({
    application_id: id,
    name: app.name,
    email: app.email,
    affiliate_code: code,
  });
  if (insertErr) {
    console.error("affiliate insert", insertErr);
    return NextResponse.json({ error: "Failed to create affiliate" }, { status: 500 });
  }

  await admin
    .from("affiliate_applications")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", id);

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "PitchIQ <admin@pitchiq.live>";
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: fromEmail,
      to: [app.email],
      subject: "You're approved for the PitchIQ Affiliate Program",
      html: `
        <p>Hi ${app.name},</p>
        <p>You're in! Welcome to the PitchIQ affiliate program.</p>
        <p><strong>Your unique affiliate code:</strong> <code>${code}</code></p>
        <p>Share your link: <strong>https://pitchiq.live?ref=${code}</strong> (or add <code>?ref=${code}</code> to any PitchIQ URL). When someone signs up and subscribes using your code, you earn 40% of their subscription revenue—every month they stay.</p>
        <p>No cap, no clawback. The more you refer, the more you earn.</p>
        <p>If you have questions, reply to this email.</p>
        <p>— The PitchIQ Team</p>
      `,
    });
  }

  return NextResponse.json({ ok: true, code });
}
