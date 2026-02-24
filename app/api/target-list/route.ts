import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { podcast_id } = await request.json();
  if (!podcast_id) return NextResponse.json({ error: "podcast_id required" }, { status: 400 });

  const { error } = await supabase.from("target_list").insert({ user_id: user.id, podcast_id });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already in list" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const podcastId = searchParams.get("podcast_id");
  if (!podcastId) return NextResponse.json({ error: "podcast_id required" }, { status: 400 });

  const { error } = await supabase.from("target_list").delete().eq("user_id", user.id).eq("podcast_id", podcastId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
