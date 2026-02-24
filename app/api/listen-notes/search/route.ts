import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const LISTEN_NOTES_BASE = "https://listen-api.listennotes.com/api/v2";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const key = process.env.LISTEN_NOTES_API_KEY;
    if (!key) return NextResponse.json({ error: "Listen Notes API key not configured" }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));
    const pageSize = Math.min(10, Math.max(1, parseInt(searchParams.get("page_size") ?? "10", 10)));

    const params = new URLSearchParams({
      q: q || "podcast",
      type: "podcast",
      offset: String(offset),
      page_size: String(pageSize),
    });

    const res = await fetch(`${LISTEN_NOTES_BASE}/search?${params}`, {
      headers: { "X-ListenAPI-Key": key },
      next: { revalidate: 0 },
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: res.status === 429 ? "Rate limit exceeded" : "Listen Notes request failed" },
        { status: res.status === 429 ? 429 : 502 }
      );
    }
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid response from Listen Notes" }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
