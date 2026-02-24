"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  podcastId: string;
  initial: { host_email?: string | null; host_name?: string | null; contact_url?: string | null; website_url?: string | null };
};

export function EditPodcastForm({ podcastId, initial }: Props) {
  const router = useRouter();
  const [hostEmail, setHostEmail] = useState(initial.host_email ?? "");
  const [hostName, setHostName] = useState(initial.host_name ?? "");
  const [contactUrl, setContactUrl] = useState(initial.contact_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial.website_url ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch(`/api/podcasts/${podcastId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host_email: hostEmail || null,
        host_name: hostName || null,
        contact_url: contactUrl || null,
        website_url: websiteUrl || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError((data as { error?: string }).error || "Failed to save");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-3">
      <h2 className="font-semibold">Contact info</h2>
      <p className="text-sm text-[var(--muted)]">Add host email so you can send pitches from the app. Optional: host name, contact or website link.</p>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Host email</span>
        <input
          type="email"
          value={hostEmail}
          onChange={(e) => setHostEmail(e.target.value)}
          placeholder="host@podcast.com"
          className="mt-1 w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Host name</span>
        <input
          type="text"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          placeholder="Jane Doe"
          className="mt-1 w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Contact URL</span>
        <input
          type="url"
          value={contactUrl}
          onChange={(e) => setContactUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Website URL</span>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-[var(--muted)]">Saved.</span>}
      </div>
    </form>
  );
}
