"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

const items: { label: string; href: string }[] = [
  { label: "Podcasts", href: "/discover" },
  { label: "VC", href: "/discover/vc" },
  { label: "Media", href: "/discover/media" },
  { label: "Social Collabs", href: "/discover/social-collabs" },
];

export function DiscoverNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[var(--muted)] hover:text-[var(--text)]"
      >
        Discover
      </button>
      {open && (
        <div className="absolute top-full left-0 pt-1 z-50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[160px]">
            {items.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="block px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--border)]/50"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
