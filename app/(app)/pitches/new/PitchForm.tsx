"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export function PitchForm({ targetList }: { targetList: { id: string; podcast_id: string; podcasts: Row["podcasts"] | Row["podcasts"][] }[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(targetList.map((r) => r.podcast_id)));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ podcast_id: string; subject: string; body: string; template_id?: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(podcastId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(podcastId)) next.delete(podcastId);
      else next.add(podcastId);
      return next;
    });
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
    if (!res.ok) {
      setError(data.error ?? "Failed to generate");
      return;
    }
    setResult(data.pitches ?? []);
  }

  if (result?.length) {
    return (
      <div className="space-y-6">
        <p className="text-[var(--muted)]">Review, copy, and mark as sent when you’ve emailed.</p>
        {result.map((p) => (
          <PitchDraft key={p.podcast_id} podcastId={p.podcast_id} subject={p.subject} body={p.body} templateId={p.template_id} />
        ))}
        <button type="button" onClick={() => { setResult(null); }} className="border border-[var(--border)] px-4 py-2 rounded-lg hover:bg-[var(--surface)]">Generate again</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {targetList.map((r) => {
          const pod = normPodcast(r.podcasts);
          return (
            <li key={r.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(r.podcast_id)}
                onChange={() => toggle(r.podcast_id)}
                className="rounded border-[var(--border)]"
              />
              <span>{pod?.title ?? "Podcast"}</span>
            </li>
          );
        })}
      </ul>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="button" onClick={generate} disabled={loading || selected.size === 0} className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50">
        {loading ? "Generating…" : `Generate ${selected.size} pitch(es)`}
      </button>
    </div>
  );
}

function PitchDraft({ podcastId, subject, body, templateId }: { podcastId: string; subject: string; body: string; templateId?: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function copy() {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendPitch() {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/pitches/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podcast_id: podcastId,
          subject,
          body,
          template_id: templateId,
          base_url: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Failed to send");
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
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={copy} className="text-sm border border-[var(--border)] px-3 py-1.5 rounded hover:bg-[var(--surface)]">
          {copied ? "Copied" : "Copy to clipboard"}
        </button>
        {!sent && (
          <button type="button" onClick={sendPitch} disabled={sending} className="text-sm bg-[var(--accent)] text-[var(--bg)] px-3 py-1.5 rounded hover:bg-[var(--accent-hover)] disabled:opacity-50">
            {sending ? "Sending…" : "Send pitch"}
          </button>
        )}
        {sent && <span className="text-sm text-[var(--muted)]">Sent</span>}
      </div>
    </div>
  );
}
