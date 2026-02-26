"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const TOTAL_TO_SHOW = 15;
const DEFAULT_QUERY = "podcast";

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
  match_iq?: number;
  match_reasoning?: string[];
};

type Genre = { id: number; name: string; parent_id?: number };

function buildSearchUrl(
  q: string,
  offset: number,
  pageSize: number,
  filters: { genreIds?: string; publishedAfter?: string; episodeCountMin?: string; episodeCountMax?: string }
): string {
  const params = new URLSearchParams({
    q: q || "podcast",
    offset: String(offset),
    page_size: String(pageSize),
  });
  if (filters.genreIds) params.set("genre_ids", filters.genreIds);
  if (filters.publishedAfter) params.set("published_after", filters.publishedAfter);
  if (filters.episodeCountMin) params.set("episode_count_min", filters.episodeCountMin);
  if (filters.episodeCountMax) params.set("episode_count_max", filters.episodeCountMax);
  return `/api/listen-notes/search?${params}`;
}

export function DiscoverSearch() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState(DEFAULT_QUERY);
  const [results, setResults] = useState<LNResult[]>([]);
  const [inList, setInList] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreId, setGenreId] = useState<string>("");
  const [lastEpisodeDays, setLastEpisodeDays] = useState<string>("");
  const [episodeCountMin, setEpisodeCountMin] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const loadGenres = useCallback(async () => {
    try {
      const res = await fetch("/api/listen-notes/genres");
      if (res.ok) {
        const data = await res.json();
        setGenres(data);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadPodcasts = useCallback(
    async (query: string) => {
      const q = (query || DEFAULT_QUERY).trim() || DEFAULT_QUERY;
      setError(null);
      setLoading(true);
      try {
        const publishedAfter =
          lastEpisodeDays && /^\d+$/.test(lastEpisodeDays)
            ? String(Date.now() - parseInt(lastEpisodeDays, 10) * 24 * 60 * 60 * 1000)
            : undefined;

        const filters = {
          genreIds: genreId || undefined,
          publishedAfter,
          episodeCountMin: episodeCountMin || undefined,
          episodeCountMax: undefined,
        };

        const urls = [
          buildSearchUrl(q, 0, 10, filters),
          buildSearchUrl(q, 10, 5, filters),
        ];
        const [res1, res2] = await Promise.all([fetch(urls[0]), fetch(urls[1])]);

        const data1 = await res1.json().catch(() => ({}));
        const data2 = await res2.json().catch(() => ({}));

        if (!res1.ok && !res2.ok) {
          throw new Error(data1.error || data2.error || "Failed to load podcasts");
        }

        const list1 = res1.ok ? (data1.results ?? []) : [];
        const list2 = res2.ok ? (data2.results ?? []) : [];
        const combined = [...list1, ...list2]
          .filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i)
          .sort((a, b) => (b.match_iq ?? 0) - (a.match_iq ?? 0))
          .slice(0, TOTAL_TO_SHOW) as LNResult[];
        setResults(combined);
        setSearchQuery(q);

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
    },
    [genreId, lastEpisodeDays, episodeCountMin]
  );

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  useEffect(() => {
    loadPodcasts(DEFAULT_QUERY);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim() || DEFAULT_QUERY;
    loadPodcasts(q);
  }

  function applyFilters() {
    const q = searchInput.trim() || searchQuery;
    loadPodcasts(q);
    setShowFilters(false);
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
        Search Listen Notes. Results are ranked by Match IQ based on your profile.
      </p>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2 flex-wrap">
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
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className={`border px-4 py-2 rounded-lg font-medium ${
            showFilters ? "border-[var(--accent)] bg-[var(--surface)]" : "border-[var(--border)] hover:bg-[var(--surface)]"
          }`}
        >
          Filters
        </button>
      </form>

      {showFilters && (
        <div className="mb-6 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg flex flex-wrap gap-4 items-end">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-[var(--muted)]">Category</span>
            <select
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              className="bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] min-w-[160px]"
            >
              <option value="">Any</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-[var(--muted)]">Last episode within (days)</span>
            <input
              type="number"
              min="1"
              placeholder="e.g. 90"
              value={lastEpisodeDays}
              onChange={(e) => setLastEpisodeDays(e.target.value)}
              className="bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] w-24"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-[var(--muted)]">Min episodes</span>
            <input
              type="number"
              min="1"
              placeholder="e.g. 10"
              value={episodeCountMin}
              onChange={(e) => setEpisodeCountMin(e.target.value)}
              className="bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] w-24"
            />
          </label>
          <button
            type="button"
            onClick={applyFilters}
            className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)]"
          >
            Apply
          </button>
        </div>
      )}

      {searchQuery !== DEFAULT_QUERY && results.length > 0 && (
        <p className="text-sm text-[var(--muted)] mb-2">
          Top {results.length} for &quot;{searchQuery}&quot; (ranked by Match IQ)
        </p>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : (
        <>
          <ul className="space-y-4">
            {results.map((p) => {
              const title = p.title_original || "Podcast";
              const img = p.image || p.thumbnail;
              const matchIq = p.match_iq ?? 0;
              const reasoning = p.match_reasoning ?? [];
              return (
                <li key={p.id} className="flex gap-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
                  {img ? (
                    <img src={img} alt="" className="w-20 h-20 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded bg-[var(--border)] shrink-0 flex items-center justify-center text-[var(--muted)] text-xs">
                      No art
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link href={`/discover/ln/${p.id}`} className="font-semibold hover:underline">
                        {title}
                      </Link>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          matchIq >= 70 ? "bg-emerald-900/50 text-emerald-300" : matchIq >= 50 ? "bg-amber-900/50 text-amber-300" : "bg-[var(--border)] text-[var(--muted)]"
                        }`}
                      >
                        Match IQ {matchIq}
                      </span>
                    </div>
                    {p.publisher_original && (
                      <p className="text-sm text-[var(--muted)] mt-0.5">Publisher: {p.publisher_original}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm font-medium text-[var(--text)] mt-1">
                      {p.latest_pub_date_ms != null && (
                        <span>
                          Last episode:{" "}
                          {new Date(p.latest_pub_date_ms).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {([p.itunes_id && "Apple Podcasts", p.spotify_id && "Spotify"].filter(Boolean) as string[]).length > 0 && (
                        <span>Platforms: {[p.itunes_id && "Apple Podcasts", p.spotify_id && "Spotify"].filter(Boolean).join(", ")}</span>
                      )}
                    </div>
                    {reasoning.length > 0 && (
                      <p className="text-xs text-[var(--muted)] mt-1.5">{reasoning.join(" · ")}</p>
                    )}
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
              No podcasts found. Results are powered by{" "}
              <a href="https://www.listennotes.com/api/docs/" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                Listen Notes
              </a>
              .
            </p>
          )}
        </>
      )}
    </div>
  );
}
