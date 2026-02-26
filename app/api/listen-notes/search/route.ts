import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { computeMatchIQ, type LNPodcast, type ProfileForScoring } from "@/lib/match-iq";

export const dynamic = "force-dynamic";

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
    const genreIds = searchParams.get("genre_ids")?.trim() || "";
    const publishedAfter = searchParams.get("published_after");
    const episodeCountMin = searchParams.get("episode_count_min");
    const episodeCountMax = searchParams.get("episode_count_max");
    const updateFreqMin = searchParams.get("update_freq_min");
    const updateFreqMax = searchParams.get("update_freq_max");

    const params = new URLSearchParams({
      q: q || "podcast",
      type: "podcast",
      offset: String(offset),
      page_size: String(pageSize),
    });
    if (genreIds) params.set("genre_ids", genreIds);
    if (publishedAfter) params.set("published_after", publishedAfter);
    if (episodeCountMin) params.set("episode_count_min", episodeCountMin);
    if (episodeCountMax) params.set("episode_count_max", episodeCountMax);
    if (updateFreqMin) params.set("update_freq_min", updateFreqMin);
    if (updateFreqMax) params.set("update_freq_max", updateFreqMax);

    const [lnRes, { data: profile }] = await Promise.all([
      fetch(`${LISTEN_NOTES_BASE}/search?${params}`, {
        headers: { "X-ListenAPI-Key": key },
        next: { revalidate: 0 },
      }),
      supabase
        .from("profiles")
        .select("expertise_topics, speaking_topics, target_audience, goals, vertical_interests")
        .eq("id", user.id)
        .single(),
    ]);

    const text = await lnRes.text();
    if (!lnRes.ok) {
      return NextResponse.json(
        { error: lnRes.status === 429 ? "Rate limit exceeded" : "Listen Notes request failed" },
        { status: lnRes.status === 429 ? 429 : 502 }
      );
    }
    let lnData: { results?: LNPodcast[]; total?: number; next_offset?: number };
    try {
      lnData = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid response from Listen Notes" }, { status: 502 });
    }

    const rawResults = (lnData.results ?? []) as LNPodcast[];
    const profileForScoring: ProfileForScoring = {
      expertise_topics: profile?.expertise_topics ?? null,
      speaking_topics: profile?.speaking_topics ?? null,
      target_audience: profile?.target_audience ?? null,
      goals: profile?.goals ?? null,
      vertical_interests: profile?.vertical_interests ?? null,
    };

    const scored = rawResults.map((p) => {
      const { score, reasoning } = computeMatchIQ(profileForScoring, p);
      return { ...p, match_iq: score, match_reasoning: reasoning };
    });
    scored.sort((a, b) => (b.match_iq ?? 0) - (a.match_iq ?? 0));

    return NextResponse.json({
      results: scored,
      total: lnData.total ?? 0,
      next_offset: lnData.next_offset,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
