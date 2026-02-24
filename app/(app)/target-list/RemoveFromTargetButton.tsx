"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveFromTargetButton({ podcastId }: { podcastId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    await fetch(`/api/target-list?podcast_id=${encodeURIComponent(podcastId)}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button type="button" onClick={remove} disabled={loading} className="text-sm border border-[var(--border)] px-3 py-1.5 rounded-lg hover:bg-[var(--surface)] disabled:opacity-50">
      {loading ? "Removing…" : "Remove"}
    </button>
  );
}
