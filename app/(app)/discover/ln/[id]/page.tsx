import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddToTargetFromLN } from "./AddToTargetFromLN";

export default async function ListenNotesPodcastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const key = process.env.LISTEN_NOTES_API_KEY;
  if (!key) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-[var(--muted)]">Listen Notes API key not configured.</p>
        <Link href="/discover" className="text-[var(--accent)] hover:underline mt-2 inline-block">← Discover</Link>
      </div>
    );
  }

  const res = await fetch(`https://listen-api.listennotes.com/api/v2/podcasts/${encodeURIComponent(id)}`, {
    headers: { "X-ListenAPI-Key": key },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    if (res.status === 404) notFound();
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-red-400">Failed to load podcast.</p>
        <Link href="/discover" className="text-[var(--accent)] hover:underline mt-2 inline-block">← Discover</Link>
      </div>
    );
  }

  const podcast = await res.json();
  const title = podcast.title || "Podcast";
  const description = podcast.description || "";
  const publisher = podcast.publisher;
  const image = podcast.image || podcast.thumbnail;
  const website = podcast.website;
  const email = podcast.email;
  const listennotes_url = podcast.listennotes_url;
  const latest_pub_date_ms = podcast.latest_pub_date_ms;
  const itunes_id = podcast.itunes_id;
  const spotify_url = podcast.spotify_url;
  const platforms = [
    itunes_id && "Apple Podcasts",
    spotify_url && "Spotify",
  ].filter(Boolean) as string[];

  // Check if already in target list (by our DB podcast with this listen_notes_id)
  const { data: ourPodcast } = await supabase
    .from("podcasts")
    .select("id")
    .eq("listen_notes_id", id)
    .maybeSingle();
  const { data: inTarget } = ourPodcast
    ? await supabase.from("target_list").select("id").eq("user_id", user.id).eq("podcast_id", ourPodcast.id).maybeSingle()
    : { data: null };
  const alreadyInList = !!inTarget;

  const lnPayload = {
    id: podcast.id,
    title_original: podcast.title,
    description_original: podcast.description,
    publisher_original: podcast.publisher,
    image: podcast.image,
    thumbnail: podcast.thumbnail,
    website: podcast.website,
    email: podcast.email,
    rss: podcast.rss,
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/discover" className="text-sm text-[var(--muted)] hover:text-[var(--text)] mb-4 inline-block">← Discover</Link>
      <div className="flex gap-6">
        {image ? (
          <img src={image} alt="" className="w-32 h-32 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-32 h-32 rounded-lg bg-[var(--border)] shrink-0 flex items-center justify-center text-[var(--muted)]">No art</div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {publisher && <p className="text-[var(--muted)] mt-1">Publisher: {publisher}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-base font-medium text-[var(--text)] mt-2">
            {latest_pub_date_ms != null && <span>Last episode: {new Date(latest_pub_date_ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>}
            {platforms.length > 0 && <span>Platforms: {platforms.join(", ")}</span>}
          </div>
          {!alreadyInList && <div className="mt-4"><AddToTargetFromLN payload={lnPayload} /></div>}
          {alreadyInList && <p className="mt-4 text-sm text-[var(--muted)]">In your target list</p>}
        </div>
      </div>
      {description && <p className="mt-6 text-[var(--muted)] whitespace-pre-wrap">{description}</p>}
      <div className="mt-6 flex flex-wrap gap-4">
        {website && <a href={website} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Website</a>}
        {itunes_id && <a href={`https://podcasts.apple.com/podcast/id${itunes_id}`} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Apple Podcasts</a>}
        {spotify_url && <a href={spotify_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Spotify</a>}
        {listennotes_url && <a href={listennotes_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Listen Notes</a>}
        {email && <a href={`mailto:${email}`} className="text-[var(--accent)] hover:underline">Email</a>}
      </div>
    </div>
  );
}
