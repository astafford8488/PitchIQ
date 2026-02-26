import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LISTEN_NOTES_BASE = "https://listen-api.listennotes.com/api/v2";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.LISTEN_NOTES_API_KEY;
  if (!key) return NextResponse.json({ error: "Listen Notes API key not configured" }, { status: 503 });

  const res = await fetch(`${LISTEN_NOTES_BASE}/genres?top_level_only=1`, {
    headers: { "X-ListenAPI-Key": key },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return NextResponse.json({ error: "Failed to fetch genres" }, { status: 502 });
  const data = await res.json();
  return NextResponse.json(data.genres ?? []);
}
