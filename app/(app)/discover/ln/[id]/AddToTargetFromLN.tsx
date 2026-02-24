"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToTargetFromLN({ payload }: { payload: Record<string, unknown> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function add() {
    setLoading(true);
    const res = await fetch("/api/listen-notes/add-to-target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={loading}
      className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
    >
      {loading ? "Adding…" : "Add to target list"}
    </button>
  );
}
