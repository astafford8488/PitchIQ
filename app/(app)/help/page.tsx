import Link from "next/link";
import { HELP_ARTICLES } from "@/lib/help-articles";

export default function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Help</h1>
      <p className="text-[var(--muted)] mb-8">Guides for core workflows.</p>

      <div className="space-y-4">
        {HELP_ARTICLES.map((a) => (
          <Link
            key={a.slug}
            href={`/help/${a.slug}`}
            className="block p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors"
          >
            <h2 className="font-semibold">{a.title}</h2>
            <p className="text-sm text-[var(--muted)] mt-1">{a.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
