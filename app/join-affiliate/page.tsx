"use client";

import { useState } from "react";
import Link from "next/link";

export default function JoinAffiliatePage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    audience_size: "",
    audience_platforms: "",
    website_or_handles: "",
    how_heard: "",
    notes: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Failed to submit.");
        return;
      }
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-2">Application received</h1>
          <p className="text-[var(--muted)] mb-6">
            Thanks for your interest in the PitchIQ affiliate program. We&apos;ll review your application and get back to you soon.
          </p>
          <Link href="/" className="text-[var(--accent)] hover:underline">Back to PitchIQ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[var(--bg)]">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">← PitchIQ</Link>
          <h1 className="text-2xl font-bold mt-2">Affiliate program application</h1>
          <p className="text-[var(--muted)] mt-1">Apply to join our affiliate program and earn 40% recurring revenue.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)]"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)]"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Audience size</label>
            <input
              type="text"
              value={form.audience_size}
              onChange={(e) => setForm((f) => ({ ...f, audience_size: e.target.value }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)]"
              placeholder="e.g. 10K followers, 50K newsletter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Audience platforms</label>
            <input
              type="text"
              value={form.audience_platforms}
              onChange={(e) => setForm((f) => ({ ...f, audience_platforms: e.target.value }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)]"
              placeholder="e.g. Instagram, YouTube, TikTok, podcast"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Website or social handles</label>
            <input
              type="text"
              value={form.website_or_handles}
              onChange={(e) => setForm((f) => ({ ...f, website_or_handles: e.target.value }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)]"
              placeholder="e.g. @handle, yoursite.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">How did you hear about us?</label>
            <input
              type="text"
              value={form.how_heard}
              onChange={(e) => setForm((f) => ({ ...f, how_heard: e.target.value }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)]"
              placeholder="e.g. social, search, referral"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Anything else we should know?</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] resize-none"
              placeholder="Optional"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="w-full bg-[var(--accent)] text-[var(--bg)] py-3 rounded-lg font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {sending ? "Submitting…" : "Submit application"}
          </button>
        </form>
      </div>
    </div>
  );
}
