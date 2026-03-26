"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  onboardingInitial: boolean;
  marketingInitial: boolean;
};

export function EmailPreferencesCard({ onboardingInitial, marketingInitial }: Props) {
  const router = useRouter();
  const [onboardingEnabled, setOnboardingEnabled] = useState(onboardingInitial);
  const [marketingEnabled, setMarketingEnabled] = useState(marketingInitial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function savePreferences() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/email/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onboarding_emails_enabled: onboardingEnabled,
        marketing_emails_enabled: marketingEnabled,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? `Save failed (${res.status})`);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function unsubscribeAll() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/email/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unsubscribe_all: true }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? `Save failed (${res.status})`);
      return;
    }
    setOnboardingEnabled(false);
    setMarketingEnabled(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
      <div>
        <h3 className="font-semibold">Email preferences</h3>
        <p className="text-sm text-[var(--muted)]">
          Control which non-transactional emails you receive from PitchIQ.
        </p>
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={onboardingEnabled}
          onChange={(e) => setOnboardingEnabled(e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm">
          <strong>Onboarding emails</strong>
          <span className="block text-[var(--muted)]">Welcome and activation sequence after signup.</span>
        </span>
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={marketingEnabled}
          onChange={(e) => setMarketingEnabled(e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm">
          <strong>Marketing emails</strong>
          <span className="block text-[var(--muted)]">Product updates, offers, and announcements.</span>
        </span>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          onClick={savePreferences}
          disabled={saving}
          className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save preferences"}
        </button>
        <button
          type="button"
          onClick={unsubscribeAll}
          disabled={saving}
          className="text-sm text-[var(--muted)] hover:text-[var(--text)] underline disabled:opacity-50"
        >
          Unsubscribe from all
        </button>
        {saved && <span className="text-sm text-[var(--muted)]">Saved.</span>}
      </div>
    </div>
  );
}
