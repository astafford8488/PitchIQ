"use client";

/** Simple markdown renderer for help content — handles ##, **, `, and paragraphs. */
export function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-lg font-semibold mt-6 mb-2 first:mt-0">
          {formatInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={key++} className="font-medium mb-2">
          {formatInline(line.slice(2, -2))}
        </p>
      );
    } else if (line.trim()) {
      elements.push(
        <p key={key++} className="text-[var(--muted)] mb-2">
          {formatInline(line)}
        </p>
      );
    } else {
      elements.push(<div key={key++} className="h-2" />);
    }
  }

  return <div className="prose prose-invert prose-sm max-w-none">{elements}</div>;
}

function formatInline(text: string): React.ReactNode | string {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let k = 0;

  while (remaining.length > 0) {
    const bold = remaining.match(/\*\*(.+?)\*\*/);
    const code = remaining.match(/`([^`]+)`/);

    let match: RegExpMatchArray | null = null;
    let type: "bold" | "code" = "bold";
    let matchStart = remaining.length;

    if (bold && bold.index !== undefined) {
      match = bold;
      matchStart = bold.index;
    }
    if (code && code.index !== undefined && code.index < matchStart) {
      match = code;
      type = "code";
    }

    if (match && match.index !== undefined) {
      if (match.index > 0) {
        parts.push(remaining.slice(0, match.index));
      }
      parts.push(
        type === "bold" ? (
          <strong key={k++}>{match[1]}</strong>
        ) : (
          <code key={k++} className="bg-[var(--surface)] px-1 rounded text-xs">
            {match[1]}
          </code>
        )
      );
      remaining = remaining.slice(match.index + match[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return <>{parts}</>;
}
