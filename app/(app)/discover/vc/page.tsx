import Link from "next/link";

export default function VCDiscoverPage() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <Link href="/discover" className="text-sm text-[var(--muted)] hover:text-[var(--text)] mb-4 inline-block">← Discover</Link>
      <h1 className="text-2xl font-bold mb-2">VC</h1>
      <p className="text-3xl font-semibold text-[var(--muted)]">Coming Soon!</p>
    </div>
  );
}
