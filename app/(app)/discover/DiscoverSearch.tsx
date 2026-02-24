"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const TOTAL_TO_SHOW = 15;
const DEFAULT_QUERY = "podcast";
const CACHE_PREFIX = "discover-podcasts-";
const CACHE_MINUTES = 5;

type LNResult = {
  id: string;
  title_original?: string;
  description_original?: string;
  publisher_original?: string;
  image?: string;
  thumbnail?: string;
  website?: string;
  email?: string;
  listennotes_url?: string;
  latest_pub_date_ms?: number;
  itunes_id?: number;
  spotify_id?: string;
};

function cacheKey(q: string) {
  return CACHE_PREFIX + (q || DEFAULT_QUERY).toLowerCase().trim();
}

export function DiscoverSearch() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState(DEFAULT_QUERY);
  const [results, setResults] = useState<LNResult[]>([]);
  const [inList, setInList] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  async function loadPodcasts(query: string) {
    const q = (query || DEFAULT_QUERY).trim() || DEFAULT_QUERY;
    setError(null);
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        const raw = sessionStorage.getItem(cacheKey(q));
        if (raw) {
            const { at, results: cached } = JSON.parse(raw) as { at: number; results: LNResult[] };
            if (Date.now() - at < CACHE_MINUTES * 60 * 1000 && cached?.length) {
              setResults(cached);
              setSearchQuery(q);
              const ids = cached.map((r) => r.id).filter(Boolean);
            const checkRes = await fetch(`/api/target-list/check?listen_notes_ids=${ids.join(",")}`);
            const check = await checkRes.json().catch(() => ({}));
            setInList(new Set(((check as { in_list?: string[] }).in_list ?? []) as string[]));
            setLoading(false);
            return;
          }
        }
      }
      const [res1, res2] = await Promise.all([
        fetch(`/api/listen-notes/search?q=${encodeURIComponent(q)}&page_size=10&offset=0`),
        fetch(`/api/listen-notes/search?q=${encodeURIComponent(q)}&page_size=5&offset=10`),
      ]);
      const text1 = await res1.text();
      const text2 = await res2.text();
      let page1: { results?: LNResult[]; error?: string } = {};
      let page2: { results?: LNResult[]; error?: string } = {};
      try {
        page1 = text1.startsWith("{") ? JSON.parse(text1) : {};
      } catch {
        throw new Error("Server returned an invalid response. Try again in a moment.");
      }
      try {
        page2 = text2.startsWith("{") ? JSON.parse(text2) : {};
      } catch {
        throw new Error("Server returned an invalid response. Try again in a moment.");
      }
      if (!res1.ok && !res2.ok) throw new Error(page1.error || page2.error || "Failed to load podcasts.");
      const list1 = res1.ok ? (page1.results ?? []) : [];
      const list2 = res2.ok ? (page2.results ?? []) : [];
      const combined = [...list1, ...list2].slice(0, TOTAL_TO_SHOW) as LNResult[];
      setResults(combined);
      setSearchQuery(q);
      if (typeof window !== "undefined" && combined.length > 0) {
        sessionStorage.setItem(cacheKey(q), JSON.stringify({ at: Date.now(), results: combined }));
      }
      if (combined.length > 0) {
        const ids = combined.map((r) => r.id).filter(Boolean);
        const checkRes = await fetch(`/api/target-list/check?listen_notes_ids=${ids.join(",")}`);
        const check = await checkRes.json().catch(() => ({}));
        setInList(new Set(((check as { in_list?: string[] }).in_list ?? []) as string[]));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load podcasts");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPodcasts(DEFAULT_QUERY);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim() || DEFAULT_QUERY;
    loadPodcasts(q);
  }

  async function addToTarget(podcast: LNResult) {
    setAddingId(podcast.id);
    try {
      const res = await fetch("/api/listen-notes/add-to-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(podcast),
      });
      const data = await res.json();
      if (res.ok) {
        setInList((prev) => new Set(prev).add(podcast.id));
      } else {
        setError(data.error || "Failed to add");
      }
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Discover podcasts</h1>
      <p className="text-[var(--muted)] mb-4">
        Search Listen Notes or browse the top 15. Add shows to your target list to generate pitches.
      </p>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2 flex-wrap">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="e.g. business, marketing, health…"
          className="flex-1 min-w-[200px] bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {searchQuery !== DEFAULT_QUERY && results.length > 0 && (
        <p className="text-sm text-[var(--muted)] mb-2">
          Top 15 for &quot;{searchQuery}&quot;
        </p>
      )}

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {loading ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : (
        <>
          <ul className="space-y-4">
            {results.map((p) => {
              const title = p.title_original || "Podcast";
              const img = p.image || p.thumbnail;
              return (
                <li key={p.id} className="flex gap-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
                  {img ? (
                    <img src={img} alt="" className="w-20 h-20 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded bg-[var(--border)] shrink-0 flex items-center justify-center text-[var(--muted)] text-xs">No art</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/discover/ln/${p.id}`}
                      className="font-semibold hover:underline"
                    >
                      {title}
                    </Link>
                    {p.publisher_original && (
                      <p className="text-sm text-[var(--muted)] mt-0.5">Publisher: {p.publisher_original}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm font-medium text-[var(--text)] mt-1">
                      {p.latest_pub_date_ms != null && (
                        <span>Last episode: {new Date(p.latest_pub_date_ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                      )}
                      {([p.itunes_id && "Apple Podcasts", p.spotify_id && "Spotify"].filter(Boolean) as string[]).length > 0 && (
                        <span>Platforms: {[p.itunes_id && "Apple Podcasts", p.spotify_id && "Spotify"].filter(Boolean).join(", ")}</span>
                      )}
                    </div>
                    {p.description_original && (
                      <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">{p.description_original}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {inList.has(p.id) ? (
                      <span className="text-sm text-[var(--muted)]">In target list</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToTarget(p)}
                        disabled={!!addingId}
                        className="text-sm bg-[var(--accent)] text-[var(--bg)] px-3 py-1.5 rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50"
                      >
                        {addingId === p.id ? "Adding…" : "Add to list"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {results.length === 0 && (
            <p className="text-[var(--muted)]">
              No podcasts loaded. Results are powered by{" "}
              <a href="https://www.listennotes.com/api/docs/" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Listen Notes</a>.
            </p>
          )}
        </>
      )}
    </div>
  );
}
