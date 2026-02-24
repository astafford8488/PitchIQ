"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

const links = [
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
];

export function AccountNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1"
      >
        Account
        <span className="text-xs" aria-hidden>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 py-1 min-w-[120px] bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-10">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--border)] first:rounded-t-lg last:rounded-b-lg"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
