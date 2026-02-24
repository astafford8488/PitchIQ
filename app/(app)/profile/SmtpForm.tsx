"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SECURITY_OPTIONS = ["Auto", "TLS", "STARTTLS", "None"];
const PORT_SUGGESTIONS = ["25", "2525", "465", "587"];
const SERVER_HINTS = "Sendgrid, Mailgun, SMTP2GO, Sendinblue, JangoSMTP, GMass";

type SmtpInitial = {
  smtp_server: string;
  smtp_port: number | string;
  smtp_security: string;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
};

export function SmtpForm({ initial }: { initial: SmtpInitial }) {
  const router = useRouter();
  const [form, setForm] = useState({
    smtp_server: initial.smtp_server ?? "",
    smtp_port: initial.smtp_port ?? 587,
    smtp_security: initial.smtp_security ?? "Auto",
    smtp_username: initial.smtp_username ?? "",
    smtp_password: initial.smtp_password ?? "",
    from_email: initial.from_email ?? "",
    to_email: "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtp_server: form.smtp_server || null,
        smtp_port: form.smtp_port ? Number(form.smtp_port) : null,
        smtp_security: form.smtp_security || null,
        smtp_username: form.smtp_username || null,
        smtp_password: form.smtp_password || null,
        from_email: form.from_email || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setSaveError((data as { error?: string }).error || `Save failed (${res.status})`);
    }
  }

  async function sendTest() {
    if (!form.from_email?.trim() || !form.to_email?.trim()) {
      setTestResult({ error: "From email and To email are required for test" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/smtp/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtp_server: form.smtp_server,
        port: form.smtp_port,
        security: form.smtp_security,
        username: form.smtp_username,
        password: form.smtp_password,
        from_email: form.from_email,
        to_email: form.to_email,
      }),
    });
    const data = await res.json();
    setTesting(false);
    if (res.ok) setTestResult({ ok: true });
    else setTestResult({ error: data.error || "Test failed" });
  }

  return (
    <form onSubmit={saveSettings} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block sm:col-span-2">
          <span className="text-sm text-[var(--muted)]">SMTP Server</span>
          <input
            type="text"
            value={form.smtp_server}
            onChange={(e) => setForm((f) => ({ ...f, smtp_server: e.target.value }))}
            placeholder="your.site.com"
            className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
          />
          <p className="mt-0.5 text-xs text-[var(--muted)]">{SERVER_HINTS}</p>
        </label>
        <label className="block">
          <span className="text-sm text-[var(--muted)]">Port</span>
          <input
            type="text"
            value={form.smtp_port}
            onChange={(e) => setForm((f) => ({ ...f, smtp_port: e.target.value }))}
            placeholder="25"
            className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
          />
          <p className="mt-0.5 text-xs text-[var(--muted)]">{PORT_SUGGESTIONS.join(" ")}</p>
        </label>
        <label className="block">
          <span className="text-sm text-[var(--muted)]">Security</span>
          <select
            value={form.smtp_security}
            onChange={(e) => setForm((f) => ({ ...f, smtp_security: e.target.value }))}
            className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]"
          >
            {SECURITY_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-[var(--muted)]">Username</span>
          <input
            type="text"
            value={form.smtp_username}
            onChange={(e) => setForm((f) => ({ ...f, smtp_username: e.target.value }))}
            placeholder="Username"
            className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-[var(--muted)]">Password</span>
          <input
            type="password"
            value={form.smtp_password}
            onChange={(e) => setForm((f) => ({ ...f, smtp_password: e.target.value }))}
            placeholder="Password"
            className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-[var(--muted)]">From email address</span>
          <input
            type="email"
            value={form.from_email}
            onChange={(e) => setForm((f) => ({ ...f, from_email: e.target.value }))}
            placeholder="From email"
            className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-[var(--muted)]">To email address (for test)</span>
          <input
            type="email"
            value={form.to_email}
            onChange={(e) => setForm((f) => ({ ...f, to_email: e.target.value }))}
            placeholder="To email"
            className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
          />
        </label>
      </div>
      {saveError && (
        <p className="text-sm text-red-400">{saveError}</p>
      )}
      {testResult && (
        <p className={`text-sm ${testResult.ok ? "text-green-400" : "text-red-400"}`}>
          {testResult.ok ? "Test email sent successfully." : testResult.error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50">
          {saving ? "Saving…" : "Save settings"}
        </button>
        <button type="button" onClick={sendTest} disabled={testing} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {testing ? "Sending…" : "Test it"}
        </button>
        {saved && <span className="text-sm text-[var(--muted)]">Saved.</span>}
      </div>
    </form>
  );
}
