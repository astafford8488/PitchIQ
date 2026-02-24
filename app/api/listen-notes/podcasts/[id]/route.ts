import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const LISTEN_NOTES_BASE = "https://listen-api.listennotes.com/api/v2";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.LISTEN_NOTES_API_KEY;
  if (!key) return NextResponse.json({ error: "Listen Notes API key not configured" }, { status: 503 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Podcast id required" }, { status: 400 });

  const res = await fetch(`${LISTEN_NOTES_BASE}/podcasts/${encodeURIComponent(id)}`, {
    headers: { "X-ListenAPI-Key": key },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    if (res.status === 404) return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
    return NextResponse.json(
      { error: res.status === 429 ? "Rate limit exceeded" : "Listen Notes request failed" },
      { status: res.status === 429 ? 429 : 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
