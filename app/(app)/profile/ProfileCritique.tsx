"use client";

import { useState } from "react";

export function ProfileCritique() {
  const [loading, setLoading] = useState(false);
  const [critique, setCritique] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function getFeedback() {
    setError(null);
    setCritique(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile/critique");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Failed to get feedback");
        return;
      }
      setCritique((data as { critique?: string }).critique ?? "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
      <h3 className="font-semibold mb-1">AI profile feedback</h3>
      <p className="text-sm text-[var(--muted)] mb-3">
        Get a short critique and advice to make your profile more compelling for pitch emails.
      </p>
      <button
        type="button"
        onClick={getFeedback}
        disabled={loading}
        className="text-sm bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Getting feedback…" : "Get AI feedback"}
      </button>
      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      {critique && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-sm font-medium text-[var(--muted)] mb-2">Feedback</p>
          <div className="text-sm text-[var(--text)] whitespace-pre-wrap">{critique}</div>
        </div>
      )}
    </div>
  );
}
