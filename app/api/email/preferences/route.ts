import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as {
      onboarding_emails_enabled?: boolean;
      marketing_emails_enabled?: boolean;
      unsubscribe_all?: boolean;
    };

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.onboarding_emails_enabled === "boolean") {
      updates.onboarding_emails_enabled = body.onboarding_emails_enabled;
    }
    if (typeof body.marketing_emails_enabled === "boolean") {
      updates.marketing_emails_enabled = body.marketing_emails_enabled;
    }
    if (body.unsubscribe_all === true) {
      updates.onboarding_emails_enabled = false;
      updates.marketing_emails_enabled = false;
      updates.unsubscribed_at = new Date().toISOString();
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
