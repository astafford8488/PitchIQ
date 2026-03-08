import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PitchRow } from "./PitchRow";
import { PitchesListHelp } from "@/components/PageHelp";

export const dynamic = "force-dynamic";

export default async function PitchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: pitches, error: pitchesError } = await supabase
    .from("pitches")
    .select("id, subject, body, status, sent_at, opened_at, first_clicked_at, follow_ups_sent, created_at, podcast_id, contact_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (pitchesError) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Pitches</h1>
        <p className="text-red-400">Could not load pitches: {pitchesError.message}. Check that all columns exist (run supabase/run-all-migrations.sql and vertical-contacts.sql if needed).</p>
      </div>
    );
  }

  const podcastIds = Array.from(new Set((pitches ?? []).map((p) => p.podcast_id).filter((id): id is string => Boolean(id))));
  const contactIds = Array.from(new Set((pitches ?? []).map((p) => p.contact_id).filter((id): id is string => Boolean(id))));

  const [podcastRows, contactRows] = await Promise.all([
    podcastIds.length ? supabase.from("podcasts").select("id, title, host_email, contact_url").in("id", podcastIds) : { data: [] as { id: string; title: string; host_email?: string; contact_url?: string }[] },
    contactIds.length ? supabase.from("contacts").select("id, name, outlet_name").in("id", contactIds) : { data: [] as { id: string; name?: string | null; outlet_name?: string | null }[] },
  ]);

  const podcastsById = new Map((podcastRows.data ?? []).map((r) => [r.id, r]));
  const contactsById = new Map((contactRows.data ?? []).map((r) => [r.id, r]));

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Pitches</h1>
      <p className="text-[var(--muted)] mb-6 flex items-center gap-2">
        Sent pitches and response status. Update status as you hear back.
        <PitchesListHelp />
      </p>

      <Link href="/pitches/new" className="inline-block mb-6 bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)]">New pitch (from target list)</Link>

      {pitches?.length ? (
        <ul className="space-y-4">
          {pitches.map((p) => {
            const podcast = p.podcast_id ? podcastsById.get(p.podcast_id) : null;
            const contact = p.contact_id ? contactsById.get(p.contact_id) : null;
            const title = podcast?.title ?? (contact ? (contact.name || contact.outlet_name || "Contact") : "Pitch");
            const isContact = !!p.contact_id;
            const targetId = (isContact ? contact?.id : podcast?.id) ?? "";
            return (
              <PitchRow
                key={p.id}
                pitchId={p.id}
                podcastTitle={title}
                podcastId={targetId}
                isContact={isContact}
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
