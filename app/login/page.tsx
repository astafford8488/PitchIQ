"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--text)] text-sm mb-6 inline-block">← Back</Link>
        <h1 className="text-2xl font-bold mb-2">Log in</h1>
        <p className="text-[var(--muted)] text-sm mb-6">Use your email to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring  focus:ring-[var(--accent)]/50"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring focus:ring-[var(--accent)]/50"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-[var(--accent)] text-[var(--bg)] py-3 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50">
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          No account? <Link href="/signup" className="text-[var(--accent)] hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
