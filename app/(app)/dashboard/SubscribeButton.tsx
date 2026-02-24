"use client";

import { useState } from "react";

export function SubscribeButton({ isSubscribed = false }: { isSubscribed?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error || "Something went wrong");
        return;
      }
      if ((data as { url?: string }).url) {
        window.location.href = (data as { url: string }).url;
        return;
      }
      setError("No checkout link received");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleManageBilling() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error || "Something went wrong");
        return;
      }
      if ((data as { url?: string }).url) {
        window.location.href = (data as { url: string }).url;
        return;
      }
      setError("No portal link received");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isSubscribed) {
    return (
      <button
        type="button"
        onClick={handleManageBilling}
        disabled={loading}
        className="border border-[var(--border)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--surface)] disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Manage billing"}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className="border border-[var(--border)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--surface)] disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Subscribe"}
      </button>
      {error && <p className="text-red-400 text-sm col-span-full">{error}</p>}
    </>
  );
}
