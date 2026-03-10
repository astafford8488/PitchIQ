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

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=/dashboard` },
    });
    setLoading(false);
    if (err) setError(err.message);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--text)] text-sm mb-6 inline-block">← Back</Link>
        <h1 className="text-2xl font-bold mb-2">Log in</h1>
        <p className="text-[var(--muted)] text-sm mb-6">Use your email or Google to continue.</p>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text)] font-medium hover:bg-[var(--border)]/30 focus:outline-none focus:ring focus:ring-[var(--accent)]/50 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <p className="my-4 text-center text-sm text-[var(--muted)]">or</p>
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
