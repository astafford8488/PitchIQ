"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Row = {
  id: string;
  podcast_id: string;
  podcasts: {
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    host_name?: string | null;
    topics?: string[] | null;
  } | null;
};


function normPodcast(p: Row["podcasts"] | Row["podcasts"][]): Row["podcasts"] {
  return Array.isArray(p) ? p[0] ?? null : p;
}

type ContactRow = { id: string; contact_id: string; contact: { id: string; name?: string | null; outlet_name?: string | null } | null };

export function PitchForm({ targetList, contactList = [] }: { targetList: { id: string; podcast_id: string; podcasts: Row["podcasts"] | Row["podcasts"][] }[]; contactList?: ContactRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(targetList.map((r) => r.podcast_id)));
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set(contactList.map((r) => r.contact_id)));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ podcast_id?: string; contact_id?: string; subject: string; body: string; template_id?: string; host_email?: string | null }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(podcastId: string) {
    setSelected((prev) => { const n = new Set(prev); if (n.has(podcastId)) n.delete(podcastId); else n.add(podcastId); return n; });
  }
  function toggleContact(id: string) {
    setSelectedContacts((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  async function generate() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/pitches/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ podcast_ids: Array.from(selected) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to generate"); return; }
    setResult(data.pitches ?? []);
  }
  async function generateContacts() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/pitches/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact_ids: Array.from(selectedContacts) }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to generate"); return; }
    setResult(data.pitches ?? []);
  }

  if (result?.length) {
    return (
      <div className="space-y-6">
        <p className="text-[var(--muted)]">Review, copy, and mark as sent when you’ve emailed.</p>
        {result.map((p, i) => (
          <PitchDraft key={p.podcast_id ?? p.contact_id ?? i} podcastId={p.podcast_id} contactId={p.contact_id} subject={p.subject} body={p.body} templateId={p.template_id} initialToEmail={p.host_email ?? ""} />
        ))}
        <button type="button" onClick={() => { setResult(null); }} className="border border-[var(--border)] px-4 py-2 rounded-lg hover:bg-[var(--surface)]">Generate again</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {targetList.length > 0 && (
        <>
          <h3 className="font-semibold">Podcasts</h3>
          <ul className="space-y-2">
            {targetList.map((r) => {
              const pod = normPodcast(r.podcasts);
              return (
                <li key={r.id} className="flex items-center gap-3">
                  <input type="checkbox" checked={selected.has(r.podcast_id)} onChange={() => toggle(r.podcast_id)} className="rounded border-[var(--border)]" />
                  <span>{pod?.title ?? "Podcast"}</span>
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={generate} disabled={loading || selected.size === 0} className="mt-2 bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50">
            {loading ? "Generating…" : `Generate ${selected.size} podcast pitch(es)`}
          </button>
        </>
      )}
      {contactList.length > 0 && (
        <>
          <h3 className="font-semibold mt-4">Media contacts</h3>
          <ul className="space-y-2">
            {contactList.map((r) => (
              <li key={r.id} className="flex items-center gap-3">
                <input type="checkbox" checked={selectedContacts.has(r.contact_id)} onChange={() => toggleContact(r.contact_id)} className="rounded border-[var(--border)]" />
                <span>{r.contact?.name || r.contact?.outlet_name || "Contact"}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={generateContacts} disabled={loading || selectedContacts.size === 0} className="mt-2 bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50">
            {loading ? "Generating…" : `Generate ${selectedContacts.size} contact pitch(es)`}
          </button>
        </>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}

function PitchDraft({ podcastId, contactId, subject, body, templateId, initialToEmail }: { podcastId?: string; contactId?: string; subject: string; body: string; templateId?: string; initialToEmail?: string }) {
  const router = useRouter();
  const [toEmail, setToEmail] = useState(initialToEmail ?? "");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorPodcastId, setErrorPodcastId] = useState<string | null>(null);

  function copy() {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendPitch() {
    setError(null);
    setErrorPodcastId(null);
    setSending(true);
    try {
      const res = await fetch("/api/pitches/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(contactId ? { contact_id: contactId } : { podcast_id: podcastId }),
          subject,
          body,
          template_id: templateId,
          base_url: typeof window !== "undefined" ? window.location.origin : undefined,
          to_email: toEmail.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = (data as { error?: string; podcast_id?: string });
        setError(err.error || "Failed to send");
        setErrorPodcastId(err.podcast_id ?? null);
        return;
      }
      setSent(true);
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
      <p className="font-medium mb-2">Subject: {subject}</p>
      <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">{body}</p>
      <label className="block mt-3">
        <span className="text-sm text-[var(--muted)]">To email (required to send)</span>
        <input
          type="email"
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
          placeholder="host@podcast.com or from their site / LinkedIn"
          className="mt-1 w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
        />
      </label>
      {error && (
        <p className="text-sm text-red-400 mt-2">
          {error}
          {errorPodcastId && (
            <> — <Link href={`/discover/${errorPodcastId}`} className="underline hover:no-underline">Add contact email</Link></>
          )}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={copy} className="text-sm border border-[var(--border)] px-3 py-1.5 rounded hover:bg-[var(--surface)]">
          {copied ? "Copied" : "Copy to clipboard"}
        </button>
        {!sent && (
          <button type="button" onClick={sendPitch} disabled={sending || !toEmail.trim()} className="text-sm bg-[var(--accent)] text-[var(--bg)] px-3 py-1.5 rounded hover:bg-[var(--accent-hover)] disabled:opacity-50">
            {sending ? "Sending…" : "Send pitch"}
          </button>
        )}
        {sent && <span className="text-sm text-[var(--muted)]">Sent</span>}
      </div>
    </div>
  );
}
