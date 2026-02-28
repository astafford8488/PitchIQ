"use client";

import Link from "next/link";

type Props = {
  used: number;
  limit: number;
  isSubscribed: boolean;
};

export function UpgradePrompt({ used, limit, isSubscribed }: Props) {
  const nearLimit = limit > 0 && used >= Math.floor(limit * 0.8);
  const atLimit = used >= limit;

  if (isSubscribed && !nearLimit && !atLimit) return null;

  return (
    <div className="mb-6 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <p className="text-sm font-medium mb-1">
        Pitches this month: {used} / {limit}
      </p>
      {atLimit && (
        <p className="text-sm text-[var(--muted)] mb-3">You&apos;ve reached your monthly limit. Upgrade for more.</p>
      )}
      {nearLimit && !atLimit && (
        <p className="text-sm text-[var(--muted)] mb-3">You&apos;re approaching your limit. Upgrade to send more.</p>
      )}
      {!isSubscribed && (
        <p className="text-sm text-[var(--muted)] mb-3">Subscribe for higher limits and full access.</p>
      )}
      <Link
        href="/billing"
        className="inline-block text-sm font-medium text-[var(--accent)] hover:underline"
      >
        {isSubscribed ? "View plans" : "Upgrade →"}
      </Link>
    </div>
  );
}
