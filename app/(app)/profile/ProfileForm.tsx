"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileForm({
  initial,
}: {
  initial: {
    full_name: string;
    bio: string;
    expertise_topics: string;
    target_audience: string;
    credentials: string;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(initial);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Full name</span>
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
          className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)]"
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Bio (used in pitches)</span>
        <textarea
          value={form.bio}
          onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
          rows={3}
          className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)]"
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Expertise / topics</span>
        <input
          type="text"
          value={form.expertise_topics}
          onChange={(e) => setForm((p) => ({ ...p, expertise_topics: e.target.value }))}
          placeholder="e.g. SaaS, marketing, coaching"
          className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Target audience</span>
        <input
          type="text"
          value={form.target_audience}
          onChange={(e) => setForm((p) => ({ ...p, target_audience: e.target.value }))}
          placeholder="Who you want to reach"
          className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Notable credentials</span>
        <textarea
          value={form.credentials}
          onChange={(e) => setForm((p) => ({ ...p, credentials: e.target.value }))}
          rows={2}
          placeholder="Books, awards, past appearances"
          className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
        />
      </label>
      <button type="submit" disabled={loading} className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50">
        {loading ? "Saving…" : "Save profile"}
      </button>
      {saved && <span className="ml-3 text-sm text-[var(--muted)]">Saved.</span>}
    </form>
  );
}
