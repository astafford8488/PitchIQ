import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** GET ?listen_notes_ids=id1,id2 returns { in_list: string[] } for those LN ids that are in the user's target list. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("listen_notes_ids");
  if (!idsParam) return NextResponse.json({ in_list: [] });

  const listenNotesIds = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (listenNotesIds.length === 0) return NextResponse.json({ in_list: [] });

  const { data: rows } = await supabase
    .from("target_list")
    .select("podcast_id, podcasts(listen_notes_id)")
    .eq("user_id", user.id);

  const inList = (rows ?? [])
    .map((r) => (r.podcasts as { listen_notes_id?: string } | null)?.listen_notes_id)
    .filter((id): id is string => typeof id === "string" && listenNotesIds.includes(id));

  return NextResponse.json({ in_list: inList });
}
