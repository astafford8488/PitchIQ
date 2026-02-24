import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
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

  const { error } = await supabase.from("pitches").update(updates).eq("id", pitch_id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
