import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddToTargetButton } from "../AddToTargetButton";
import { EditPodcastForm } from "./EditPodcastForm";

export default async function PodcastDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: podcast } = await supabase.from("podcasts").select("*").eq("id", id).single();
  if (!podcast) notFound();

  const { data: inTarget } = await supabase.from("target_list").select("id").eq("user_id", user.id).eq("podcast_id", id).maybeSingle();

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/discover" className="text-sm text-[var(--muted)] hover:text-[var(--text)] mb-4 inline-block">← Discover</Link>
      <div className="flex gap-6">
        {podcast.cover_image_url ? (
          <img src={podcast.cover_image_url} alt="" className="w-32 h-32 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-32 h-32 rounded-lg bg-[var(--border)] shrink-0 flex items-center justify-center text-[var(--muted)]">No art</div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{podcast.title}</h1>
          {podcast.category && <span className="text-[var(--muted)]">{podcast.category}</span>}
          {podcast.host_name && <p className="mt-1">Host: {podcast.host_name}</p>}
          {!inTarget && <div className="mt-4"><AddToTargetButton podcastId={podcast.id} /></div>}
          {inTarget && <p className="mt-4 text-sm text-[var(--muted)]">In your target list</p>}
        </div>
      </div>
      {podcast.description && <p className="mt-6 text-[var(--muted)]">{podcast.description}</p>}
      {(podcast.topics?.length ?? 0) > 0 && (
        <p className="mt-2 text-sm text-[var(--muted)]">Topics: {podcast.topics?.join(", ")}</p>
      )}
      <div className="mt-6 flex flex-wrap gap-4">
        {podcast.website_url && <a href={podcast.website_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Website</a>}
        {podcast.contact_url && <a href={podcast.contact_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Contact</a>}
        {podcast.host_email && <a href={`mailto:${podcast.host_email}`} className="text-[var(--accent)] hover:underline">Email host</a>}
      </div>

      <EditPodcastForm
        podcastId={podcast.id}
        initial={{
          host_email: podcast.host_email,
          host_name: podcast.host_name,
          contact_url: podcast.contact_url,
          website_url: podcast.website_url,
        }}
      />
    </div>
  );
}
