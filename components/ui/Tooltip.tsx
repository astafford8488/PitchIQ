"use client";

import { useState } from "react";

type Placement = "top" | "bottom" | "left" | "right";

export function Tooltip({
  content,
  children,
  placement = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: Placement;
}) {
  const [visible, setVisible] = useState(false);

  const placementClasses: Record<Placement, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute z-50 px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg max-w-xs whitespace-normal text-[var(--text)] ${placementClasses[placement]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}

/** Trigger that shows a "?" icon — use when you need a compact help cue. */
export function HelpTrigger({ content, placement = "top" }: { content: React.ReactNode; placement?: Placement }) {
  return (
    <Tooltip content={content} placement={placement}>
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] text-xs text-[var(--muted)] cursor-help hover:border-[var(--accent)] hover:text-[var(--accent)]"
        aria-label="Help"
      >
        ?
      </span>
    </Tooltip>
  );
}
