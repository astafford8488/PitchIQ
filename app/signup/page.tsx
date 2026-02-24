"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-[var(--muted)]">We sent a confirmation link to {email}. Click it to log in.</p>
          <Link href="/login" className="mt-6 inline-block text-[var(--accent)] hover:underline">Back to log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--text)] text-sm mb-6 inline-block">← Back</Link>
        <h1 className="text-2xl font-bold mb-2">Sign up</h1>
        <p className="text-[var(--muted)] text-sm mb-6">Create an account to start pitching podcasts.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring focus:ring-[var(--accent)]/50"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring focus:ring-[var(--accent)]/50"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring focus:ring-[var(--accent)]/50"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-[var(--accent)] text-[var(--bg)] py-3 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50">
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account? <Link href="/login" className="text-[var(--accent)] hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
