"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type App = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  audience_size: string | null;
  audience_platforms: string | null;
  website_or_handles: string | null;
  how_heard: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export function AdminApplicationsTable({ applications }: { applications: App[] }) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);

  async function approve(id: string) {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/affiliate-applications/${id}/approve`, { method: "POST" });
      if (res.ok) router.refresh();
      else {
        const d = await res.json().catch(() => ({}));
        alert((d as { error?: string }).error || "Failed");
      }
    } finally {
      setActing(null);
    }
  }

  async function deny(id: string) {
    if (!confirm("Deny this application? No email will be sent.")) return;
    setActing(id);
    try {
      const res = await fetch(`/api/admin/affiliate-applications/${id}/deny`, { method: "POST" });
      if (res.ok) router.refresh();
      else {
        const d = await res.json().catch(() => ({}));
        alert((d as { error?: string }).error || "Failed");
      }
    } finally {
      setActing(null);
    }
  }

  const pending = applications.filter((a) => a.status === "pending");
  const reviewed = applications.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b border-[var(--border)]">
          Pending applications ({pending.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/30">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Phone</th>
                <th className="text-left p-3 font-medium">Audience</th>
                <th className="text-left p-3 font-medium">Platforms</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-[var(--muted)]">No pending applications.</td>
                </tr>
              ) : (
                pending.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/20">
                    <td className="p-3">{a.name}</td>
                    <td className="p-3">{a.email}</td>
                    <td className="p-3">{a.phone ?? "—"}</td>
                    <td className="p-3">{a.audience_size ?? "—"}</td>
                    <td className="p-3">{a.audience_platforms ?? "—"}</td>
                    <td className="p-3 text-[var(--muted)]">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => approve(a.id)}
                        disabled={!!acting}
                        className="text-[var(--accent)] hover:underline disabled:opacity-50"
                      >
                        {acting === a.id ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deny(a.id)}
                        disabled={!!acting}
                        className="text-red-400 hover:underline disabled:opacity-50"
                      >
                        Deny
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reviewed.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
          <h2 className="text-lg font-semibold p-4 border-b border-[var(--border)]">Reviewed ({reviewed.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--border)]/30">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border)]">
                    <td className="p-3">{a.name}</td>
                    <td className="p-3">{a.email}</td>
                    <td className="p-3 capitalize">{a.status}</td>
                    <td className="p-3 text-[var(--muted)]">{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
