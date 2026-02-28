"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SmtpForm } from "../profile/SmtpForm";
import { DomainVerifier } from "./DomainVerifier";

function ManagedEmailForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEmail(initialEmail ?? "");
  }, [initialEmail]);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from_email: email.trim() || null }) });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
      <p className="font-medium mb-2">PitchIQ-managed sending</p>
      <p className="text-sm text-[var(--muted)] mb-4">
        Emails send via our verified domain. Add your reply-to email below so hosts can respond to you. No SMTP setup needed.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourcompany.com"
          className="flex-1 min-w-[200px] bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]"
        />
        <button type="button" onClick={save} disabled={saving} className="shrink-0 px-4 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50">
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

type SmtpInitial = {
  smtp_server: string;
  smtp_port: number | string;
  smtp_security: string;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
};

const YOUTUBE_VIDEO_ID = "ZfEK3WP73eY";

export function EmailSettings({ smtpInitial, sendingTier }: { smtpInitial: SmtpInitial; sendingTier: "own" | "managed" }) {
  const [tier, setTier] = useState<"own" | "managed">(sendingTier);
  const [fromEmail, setFromEmail] = useState(smtpInitial.from_email ?? "");

  useEffect(() => {
    setTier(sendingTier);
    if (!sendingTier) {
      fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sending_tier: "managed" }) }).catch(() => {});
    }
  }, [sendingTier]);

  async function saveTier(next: "own" | "managed") {
    setTier(next);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sending_tier: next }),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Sending method</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="tier" checked={tier === "managed"} onChange={() => saveTier("managed")} className="rounded-full border-[var(--border)]" />
            <span>PitchIQ-managed</span>
            <span className="text-xs text-[var(--muted)]">(recommended — no setup)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tier"
              checked={tier === "own"}
              onChange={() => saveTier("own")}
              className="rounded-full border-[var(--border)]"
            />
            <span>Use my own SMTP</span>
          </label>
        </div>
      </div>

      {tier === "own" && (
        <>
          <div className="prose prose-invert prose-sm max-w-none">
            <h3 className="font-semibold mb-2">Setup steps</h3>
            <ol className="list-decimal list-inside space-y-1 text-[var(--muted)] text-sm">
              <li>Pick an SMTP provider (Resend, SendGrid, Brevo, Gmail App Password, etc.)</li>
              <li>Get your SMTP host, port, username, and password from their dashboard</li>
              <li>Use an address from your own domain (e.g. pitches@yourdomain.com) for better deliverability</li>
              <li>Add SPF/DKIM/DMARC records to your domain — use the checker below to verify</li>
              <li>Save settings and click &quot;Test it&quot; to send a test email</li>
            </ol>
          </div>
          <div>
            <a
              href={`https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline text-sm mb-2 inline-block"
            >
              Watch setup video
            </a>
            <div className="aspect-video w-full max-w-lg rounded-lg overflow-hidden bg-[var(--surface)] border border-[var(--border)]">
              <iframe
                title="SMTP setup video"
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
          <SmtpForm
            initial={smtpInitial}
            onFromEmailChange={setFromEmail}
          />
          <DomainVerifier fromEmail={fromEmail} />
        </>
      )}

      {tier === "managed" && (
        <ManagedEmailForm initialEmail={smtpInitial.from_email ?? ""} />
      )}
    </div>
  );
}
