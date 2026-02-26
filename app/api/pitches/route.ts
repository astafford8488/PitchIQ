import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import type { PitchStatus } from "@/lib/types";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { pitch_id, status, subject, body: pitchBody } = body;
  if (!pitch_id) return NextResponse.json({ error: "pitch_id required" }, { status: 400 });

  const updates: { status?: PitchStatus; subject?: string; body?: string; updated_at: string } = { updated_at: new Date().toISOString() };
  if (status !== undefined) {
    const valid: PitchStatus[] = ["pending", "interested", "declined", "booked", "no_response"];
    if (!valid.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    updates.status = status;
  }
  if (subject !== undefined) updates.subject = subject;
  if (pitchBody !== undefined) updates.body = pitchBody;

  if (status === "booked") {
    const { data: pitchRow } = await supabase.from("pitches").select("template_id, status").eq("id", pitch_id).eq("user_id", user.id).single();
    if (pitchRow?.template_id && pitchRow.status !== "booked") {
      const { data: tmpl } = await supabase.from("pitch_templates").select("success_count").eq("id", pitchRow.template_id).single();
      await supabase
        .from("pitch_templates")
        .update({ success_count: (tmpl?.success_count ?? 0) + 1, updated_at: updates.updated_at })
        .eq("id", pitchRow.template_id);
    }
  }

  const { error } = await supabase.from("pitches").update(updates).eq("id", pitch_id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
