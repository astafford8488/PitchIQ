"use client";

import { useState } from "react";

type Result = {
  domain: string;
  spf: { present: boolean; record: string | null; valid: boolean };
  dmarc: { present: boolean; record: string | null; valid: boolean };
  dkim: { note: string; checked: boolean };
  healthy: boolean;
};

export function DomainVerifier({ fromEmail }: { fromEmail: string }) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkDomain = domain.trim() || (fromEmail?.includes("@") ? fromEmail.split("@")[1] : "");

  async function verify() {
    if (!checkDomain) {
      setError("Enter a domain or save your From email first");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params = domain.trim() ? `domain=${encodeURIComponent(domain.trim())}` : `from_email=${encodeURIComponent(fromEmail)}`;
      const res = await fetch(`/api/email/verify-domain?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
      <h3 className="font-semibold mb-2">Domain health check</h3>
      <p className="text-sm text-[var(--muted)] mb-3">
        Verify SPF and DMARC records before sending. Improves deliverability and reduces spam folder placement.
      </p>
      <div className="flex gap-2 flex-wrap items-end">
        <label className="flex-1 min-w-[180px]">
          <span className="text-xs text-[var(--muted)]">Domain (or use From email)</span>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={fromEmail?.includes("@") ? fromEmail.split("@")[1] : "yourdomain.com"}
            className="mt-1 w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-sm"
          />
        </label>
        <button
          type="button"
          onClick={verify}
          disabled={loading}
          className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "Checking…" : "Check"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      {result && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={result.healthy ? "text-green-400" : "text-amber-400"}>
              {result.healthy ? "✓" : "○"} {result.domain}
            </span>
            {result.healthy && <span className="text-green-400">Domain looks healthy</span>}
          </div>
          <div>
            <span className={result.spf.valid ? "text-green-400" : result.spf.present ? "text-amber-400" : "text-red-400"}>
              SPF: {result.spf.valid ? "✓ Found" : result.spf.present ? "Invalid format" : "Not found"}
            </span>
            {result.spf.record && <p className="text-xs text-[var(--muted)] mt-0.5 font-mono truncate">{result.spf.record}</p>}
          </div>
          <div>
            <span className={result.dmarc.valid ? "text-green-400" : result.dmarc.present ? "text-amber-400" : "text-red-400"}>
              DMARC: {result.dmarc.valid ? "✓ Found" : result.dmarc.present ? "Invalid format" : "Not found"}
            </span>
            {result.dmarc.record && <p className="text-xs text-[var(--muted)] mt-0.5 font-mono truncate">{result.dmarc.record}</p>}
          </div>
          <p className="text-xs text-[var(--muted)]">{result.dkim.note}</p>
        </div>
      )}
    </div>
  );
}
