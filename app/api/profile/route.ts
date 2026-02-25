import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const allowed = [
      "full_name", "bio", "expertise_topics", "target_audience", "credentials",
      "linkedin_url", "speaking_topics", "past_appearances", "book_product_links",
      "goals", "vertical_interests", "onboarding_completed_at",
      "smtp_server", "smtp_port", "smtp_security", "smtp_username", "smtp_password", "from_email",
    ] as const;
    const updates: Record<string, unknown> = {
      id: user.id,
      updated_at: new Date().toISOString(),
    };
    for (const key of allowed) {
      if (key in body) {
        if (key === "smtp_port") updates[key] = body[key] != null ? Number(body[key]) : null;
        else if (key === "onboarding_completed_at") updates[key] = body[key] ? new Date().toISOString() : null;
        else updates[key] = body[key] ?? null;
      }
    }

    const { error } = await supabase.from("profiles").upsert(updates, { onConflict: "id" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
