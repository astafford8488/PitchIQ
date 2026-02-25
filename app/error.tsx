"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isEnvError =
    error.message?.includes("SUPABASE_MISSING_ENV") ||
    error.message?.includes("Neither apikey") ||
    error.message?.includes("STRIPE_SECRET_KEY");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center max-w-lg">
      <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
      {isEnvError ? (
        <>
          <p className="text-[var(--muted)] mb-4">
            Environment variables are missing or misconfigured. In Railway: open your service → Variables →
            ensure <code className="bg-[var(--surface)] px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="bg-[var(--surface)] px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set.
          </p>
          <p className="text-sm text-[var(--muted)]">Redeploy after adding variables.</p>
        </>
      ) : (
        <p className="text-[var(--muted)] mb-4">{error.message || "An unexpected error occurred."}</p>
      )}
      <button
        onClick={reset}
        className="mt-4 bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)]"
      >
        Try again
      </button>
    </div>
  );
}
