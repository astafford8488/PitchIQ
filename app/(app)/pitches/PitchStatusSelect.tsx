"use client";

import { useRouter } from "next/navigation";
import type { PitchStatus } from "@/lib/types";

const STATUSES: PitchStatus[] = ["no_response", "interested", "declined", "booked"];

export function PitchStatusSelect({ pitchId, currentStatus }: { pitchId: string; currentStatus: string }) {
  const router = useRouter();

  async function change(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as PitchStatus;
    await fetch("/api/pitches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pitch_id: pitchId, status }),
    });
    router.refresh();
  }

  return (
    <select
      value={currentStatus}
      onChange={change}
      className="bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-1.5 text-sm capitalize"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.replace("_", " ")}</option>
      ))}
    </select>
  );
}
