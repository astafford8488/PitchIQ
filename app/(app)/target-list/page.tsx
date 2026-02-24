import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { RemoveFromTargetButton } from "./RemoveFromTargetButton";

export default async function TargetListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("target_list")
    .select("id, podcast_id, created_at, podcasts(id, title, description, category, host_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Target list</h1>
      <p className="text-[var(--muted)] mb-6">Podcasts you want to pitch. Remove any you no longer need; then generate pitches from here.</p>

      {rows?.length ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-[var(--muted)]">{rows.length} podcast(s)</span>
            <Link href="/pitches/new" className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)]">Generate pitches</Link>
          </div>
          <ul className="space-y-3">
            {rows.map((r) => {
              const raw = r.podcasts as { id: string; title: string; description?: string; category?: string; host_name?: string } | { id: string; title: string; description?: string; category?: string; host_name?: string }[] | null;
              const p = Array.isArray(raw) ? raw[0] ?? null : raw;
              return (
                <li key={r.id} className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3">
                  <div>
                    <Link href={`/discover/${p?.id}`} className="font-medium hover:underline">{p?.title ?? "Podcast"}</Link>
                    {p?.category && <span className="ml-2 text-xs text-[var(--muted)]">{p.category}</span>}
                  </div>
                  <RemoveFromTargetButton podcastId={r.podcast_id} />
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="text-[var(--muted)]">Your target list is empty. <Link href="/discover" className="text-[var(--accent)] hover:underline">Discover podcasts</Link> and add them here.</p>
      )}
    </div>
  );
}
