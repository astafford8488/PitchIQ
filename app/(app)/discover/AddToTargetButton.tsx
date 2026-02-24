"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddToTargetButton({ podcastId }: { podcastId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function add() {
    setLoading(true);
    const res = await fetch("/api/target-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ podcast_id: podcastId }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button type="button" onClick={add} disabled={loading} className="text-sm bg-[var(--accent)] text-[var(--bg)] px-3 py-1.5 rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50">
      {loading ? "Adding…" : "Add to list"}
    </button>
  );
}
