import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    id: listen_notes_id,
    title_original: title,
    description_original: description,
    publisher_original: host_name,
    image,
    thumbnail,
    website,
    email: host_email,
    rss: rss_feed_url,
  } = body;

  if (!listen_notes_id || !title) {
    return NextResponse.json({ error: "Listen Notes podcast id and title required" }, { status: 400 });
  }

  const cover_image_url = image || thumbnail || null;
  const website_url = website || null;
  const contact_url = website || null;

  const { data: existing } = await supabase
    .from("podcasts")
    .select("id")
    .eq("listen_notes_id", listen_notes_id)
    .maybeSingle();

  let podcastId: string;
  if (existing) {
    podcastId = existing.id;
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from("podcasts")
      .insert({
        title,
        description: description || null,
        website_url,
        rss_feed_url: rss_feed_url || null,
        cover_image_url,
        host_name: host_name || null,
        host_email: host_email || null,
        contact_url,
        listen_notes_id,
      })
      .select("id")
      .single();
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    podcastId = inserted.id;
  }

  const { error: listErr } = await supabase.from("target_list").insert({
    user_id: user.id,
    podcast_id: podcastId,
  });
  if (listErr) {
    if (listErr.code === "23505") return NextResponse.json({ ok: true, podcast_id: podcastId, already_in_list: true });
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, podcast_id: podcastId });
}
