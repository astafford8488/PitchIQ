"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PitchStatusSelect } from "./PitchStatusSelect";

type Props = {
  pitchId: string;
  podcastTitle: string;
  podcastId: string;
  subject: string | null;
  body: string | null;
  status: string;
  sentAt: string | null;
  openedAt?: string | null;
  clickedAt?: string | null;
  followUpsSent?: number;
};

export function PitchRow({ pitchId, podcastTitle, podcastId, subject, body, status, sentAt, openedAt, clickedAt, followUpsSent }: Props) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSubject, setEditSubject] = useState(subject ?? "");
  const [editBody, setEditBody] = useState(body ?? "");
  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    setSaving(true);
    await fetch("/api/pitches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pitch_id: pitchId, subject: editSubject, body: editBody }),
    });
    setSaving(false);
    setEditOpen(false);
    router.refresh();
  }

  return (
    <>
      <li className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={`/discover/${podcastId}`} className="font-semibold hover:underline">{podcastTitle}</Link>
            {subject && <p className="text-sm text-[var(--muted)] mt-1">Subject: {subject}</p>}
            {sentAt && <p className="text-xs text-[var(--muted)]">Sent: {new Date(sentAt).toLocaleDateString()}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="flex gap-1.5 text-xs">
              {openedAt && <span className="text-emerald-500" title="Opened">✓</span>}
              {clickedAt && <span className="text-blue-500" title="Clicked">↗</span>}
              {(followUpsSent ?? 0) > 0 && <span className="text-[var(--muted)]" title="Follow-ups">{followUpsSent}↻</span>}
            </span>
            <PitchStatusSelect pitchId={pitchId} currentStatus={status} />
            <button type="button" onClick={() => setViewOpen(true)} className="text-sm border border-[var(--border)] px-3 py-1.5 rounded-lg hover:bg-[var(--surface)]">
              View
            </button>
            <button type="button" onClick={() => { setEditSubject(subject ?? ""); setEditBody(body ?? ""); setEditOpen(true); }} className="text-sm border border-[var(--border)] px-3 py-1.5 rounded-lg hover:bg-[var(--surface)]">
              Edit
            </button>
          </div>
        </div>
        {body && <p className="mt-3 text-sm text-[var(--muted)] line-clamp-2">{body}</p>}
      </li>

      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setViewOpen(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">{podcastTitle}</h3>
            {subject && <p className="text-sm text-[var(--muted)] mb-1"><strong>Subject:</strong> {subject}</p>}
            {body && <p className="text-sm whitespace-pre-wrap mt-3">{body}</p>}
            <button type="button" onClick={() => setViewOpen(false)} className="mt-4 w-full border border-[var(--border)] py-2 rounded-lg hover:bg-[var(--bg)]">Close</button>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setEditOpen(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">Edit pitch — {podcastTitle}</h3>
            <label className="block mb-2">
              <span className="text-sm text-[var(--muted)]">Subject</span>
              <input type="text" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="mt-1 w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]" />
            </label>
            <label className="block mb-4">
              <span className="text-sm text-[var(--muted)]">Body</span>
              <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={8} className="mt-1 w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] resize-y" />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={saveEdit} disabled={saving} className="flex-1 bg-[var(--accent)] text-[var(--bg)] py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
              <button type="button" onClick={() => setEditOpen(false)} className="border border-[var(--border)] py-2 px-4 rounded-lg hover:bg-[var(--bg)]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
