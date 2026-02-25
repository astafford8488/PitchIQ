import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("SUPABASE_MISSING_ENV:")) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center max-w-lg">
          <h1 className="text-xl font-semibold mb-2">Supabase not configured</h1>
          <p className="text-[var(--muted)] mb-4">
            Add <code className="bg-[var(--surface)] px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="bg-[var(--surface)] px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Netlify.
          </p>
          <p className="text-sm text-[var(--muted)]">
            Site configuration → Environment variables → set scope to <strong>All</strong> or <strong>Build</strong> → then
            Deploys → <strong>Clear cache and deploy site</strong>.
          </p>
        </div>
      );
    }
    throw e;
  }
  if (user) redirect("/dashboard");

  const features = [
    {
      name: "Profile IQ",
      headline: "Are you worth booking?",
      description: "AI audits your bio, expertise, and LinkedIn before you send anything. Identifies exactly why hosts would ignore you — and rewrites it.",
      callout: "No competitor does this.",
    },
    {
      name: "Match IQ",
      headline: "Who should you pitch?",
      description: "Smart discovery across 3M+ podcasts filtered by topic, audience size, and booking fit.",
      callout: "Not a keyword search — a relevance engine.",
    },
    {
      name: "Pitch IQ",
      headline: "Say the right thing to the right host.",
      description: "Every pitch is grounded in the show's recent episodes and host communication style. Hosts notice. Response rates improve.",
      callout: null,
    },
    {
      name: "Follow-Up IQ",
      headline: "Never let a warm lead go cold.",
      description: "Automated follow-up sequences that sound human. No response in 5 days? It follows up in the same thread — automatically.",
      callout: null,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-semibold">PitchIQ</span>
        <nav className="flex gap-4">
          <Link href="/login" className="text-[var(--muted)] hover:text-[var(--text)]">Log in</Link>
          <Link href="/signup" className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)]">Sign up</Link>
        </nav>
      </header>
      <main className="flex-1 px-6 py-10">
        <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Get on podcasts without a PR team
            </h1>
            <p className="text-[var(--muted)] text-lg mb-8">
              Discover shows, generate personalized pitches with AI, and send outreach from your own email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="bg-[var(--accent)] text-[var(--bg)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--accent-hover)] text-center">
                Get started free
              </Link>
              <Link href="/login" className="border border-[var(--border)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--surface)] text-center">
                Log in
              </Link>
            </div>
          </div>
          <div className="relative w-full aspect-[4/3] max-h-[420px] rounded-lg overflow-hidden bg-[var(--surface)]">
            <Image
              src="/hero.png"
              alt="PitchIQ — from overwhelm to intelligent pitching"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </section>

        <section className="max-w-6xl mx-auto mt-20 pt-16 border-t border-[var(--border)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.name}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--border)] flex items-center justify-center text-xl font-bold text-[var(--accent)]">
                  {f.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-[var(--accent)] mb-1">{f.name}</h3>
                  <h4 className="font-semibold text-[var(--text)] mb-2">{f.headline}</h4>
                  <p className="text-[var(--muted)] text-sm mb-2">{f.description}</p>
                  {f.callout && (
                    <p className="text-sm text-[var(--accent)]">{f.callout}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
