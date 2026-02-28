import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PitchRow } from "./PitchRow";

export default async function PitchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: pitches } = await supabase
    .from("pitches")
    .select("id, subject, body, status, sent_at, opened_at, first_clicked_at, follow_ups_sent, created_at, podcasts(id, title, host_email, contact_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Pitches</h1>
      <p className="text-[var(--muted)] mb-6">Sent pitches and response status. Update status as you hear back.</p>

      <Link href="/pitches/new" className="inline-block mb-6 bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)]">New pitch (from target list)</Link>

      {pitches?.length ? (
        <ul className="space-y-4">
          {pitches.map((p) => {
            const raw = p.podcasts as { id: string; title: string; host_email?: string; contact_url?: string } | { id: string; title: string; host_email?: string; contact_url?: string }[] | null;
            const podcast = Array.isArray(raw) ? raw[0] ?? null : raw;
            return (
              <PitchRow
                key={p.id}
                pitchId={p.id}
                podcastTitle={podcast?.title ?? "Podcast"}
                podcastId={podcast?.id ?? ""}
                subject={p.subject}
                body={p.body}
                status={p.status}
                sentAt={p.sent_at}
                openedAt={p.opened_at}
                clickedAt={p.first_clicked_at}
                followUpsSent={p.follow_ups_sent ?? 0}
              />
            );
          })}
        </ul>
      ) : (
        <p className="text-[var(--muted)]">No pitches yet. Add podcasts to your target list and generate pitches.</p>
      )}
    </div>
  );
}
