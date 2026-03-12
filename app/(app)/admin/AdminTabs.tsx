"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const tabs = [
  { key: "users", label: "Users" },
  { key: "affiliates", label: "Affiliates" },
  { key: "applications", label: "Applications" },
] as const;

export function AdminTabs() {
  const searchParams = useSearchParams();
  const current = (searchParams.get("tab") || "users") as string;

  return (
    <nav className="flex gap-2 mb-6 border-b border-[var(--border)]">
      {tabs.map(({ key, label }) => (
        <Link
          key={key}
          href={key === "users" ? "/admin" : `/admin?tab=${key}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            current === key
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
