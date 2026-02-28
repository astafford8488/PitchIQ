"use client";

import { useState, useEffect } from "react";

type Config = {
  follow_up_days: number;
  max_follow_ups: number;
  follow_up_tone: string;
};

export function FollowUpConfig({ initial }: { initial: Config }) {
  const [config, setConfig] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setConfig(initial);
  }, [initial.follow_up_days, initial.max_follow_ups, initial.follow_up_tone]);

  async function save(next: Config) {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        follow_up_days: next.follow_up_days,
        max_follow_ups: next.max_follow_ups,
        follow_up_tone: next.follow_up_tone,
      }),
    });
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-[var(--muted)] mb-1">Days until first follow-up</label>
        <input
          type="number"
          min={3}
          max={14}
          value={config.follow_up_days}
          onChange={(e) => setConfig((c) => ({ ...c, follow_up_days: Math.max(3, Math.min(14, parseInt(e.target.value) || 7)) }))}
          onBlur={() => save(config)}
          className="w-24 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]"
        />
      </div>
      <div>
        <label className="block text-sm text-[var(--muted)] mb-1">Max follow-ups per pitch</label>
        <select
          value={config.max_follow_ups}
          onChange={(e) => {
            const v = parseInt(e.target.value) || 1;
            const next = { ...config, max_follow_ups: v };
            setConfig(next);
            save(next);
          }}
          className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-[var(--muted)] mb-1">Tone</label>
        <select
          value={config.follow_up_tone}
          onChange={(e) => {
            const v = e.target.value;
            const next = { ...config, follow_up_tone: v };
            setConfig(next);
            save(next);
          }}
          className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]"
        >
          <option value="friendly">Friendly</option>
          <option value="professional">Professional</option>
          <option value="brief">Brief</option>
        </select>
      </div>
      {saving && <p className="text-xs text-[var(--muted)]">Saving…</p>}
    </div>
  );
}
