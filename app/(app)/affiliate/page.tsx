import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AffiliatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <section className="text-center mb-16">
        <p className="text-[var(--accent)] font-semibold uppercase tracking-wider text-sm mb-3">
          PitchIQ Affiliate Program
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Earn 40% of every subscription you refer.
        </h1>
        <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto mb-8">
          Recurring revenue, no cap. Share a tool that actually wins—and get paid like a partner.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 px-6 py-3">
          <span className="text-3xl font-bold text-[var(--accent)]">40%</span>
          <span className="text-[var(--muted)] text-sm">revenue share, every month they stay</span>
        </div>
      </section>

      {/* Why the product wins */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">A product that sells itself</h2>
        <p className="text-[var(--muted)] mb-6 max-w-3xl">
          PitchIQ solves a real, expensive problem: getting on podcasts and in front of media without a PR team.
          Creators, experts, and founders need visibility—and most tools are either useless or cost a fortune.
          We combine a huge podcast and media database, AI-written pitches, one-click sending from your own email,
          open/click tracking, and smart follow-ups. It&apos;s the only platform that gets people from &quot;I want to be on shows&quot;
          to &quot;I&apos;m booked&quot; without the agency price tag.
        </p>
        <ul className="grid sm:grid-cols-2 gap-4 text-[var(--muted)]">
          {[
            "3M+ podcasts and growing—massive database, real discovery",
            "AI pitches + templates—personalized at scale",
            "Send from your own email—no fake from-address, better deliverability",
            "Open and click tracking—see who engaged",
            "Auto follow-ups—AI nudges that get replies",
            "Tiers from $29.99–$99.99/mo—clear upgrade path, high LTV",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-[var(--accent)] mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Why this affiliate program is best-in-class */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">One of the best affiliate programs out there</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2 text-[var(--accent)]">40% recurring</h3>
            <p className="text-[var(--muted)] text-sm">
              You don&apos;t get a one-time bounty—you earn 40% of the subscription revenue for as long as your referral stays.
              One referral on Platinum ($99.99/mo) is ~$40/month in your pocket. Ten referrals is $400/month. It compounds.
            </p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2 text-[var(--accent)]">No cap, no clawback</h3>
            <p className="text-[var(--muted)] text-sm">
              We don&apos;t limit how much you can earn or take back commissions if someone churns later.
              You brought them in; you get paid for the lifetime of that subscription.
            </p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2 text-[var(--accent)]">Product people actually need</h3>
            <p className="text-[var(--muted)] text-sm">
              Podcast and media outreach is a must for anyone building a personal brand or business.
              Your audience is already looking for this—you&apos;re just giving them the best option and getting paid for it.
            </p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2 text-[var(--accent)]">Built for influencers & creators</h3>
            <p className="text-[var(--muted)] text-sm">
              We designed this program for people with real reach. If you have an audience that cares about growth,
              visibility, or getting booked—this is your chance to monetize that trust with a product that delivers.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center border border-[var(--border)] rounded-xl bg-[var(--surface)] p-10">
        <h2 className="text-2xl font-bold mb-2">Get your referral link</h2>
        <p className="text-[var(--muted)] mb-4 max-w-xl mx-auto">
          Fill out a short form; we&apos;ll review and send you a unique code, link, and payout info.
        </p>
        <p className="text-[var(--muted)] text-sm mb-6">You&apos;ll be taken to an application form (stored in our system—no email app).</p>
        <Link
          href="/affiliate/apply"
          className="inline-block bg-[var(--accent)] text-[var(--bg)] px-8 py-4 rounded-lg font-semibold hover:bg-[var(--accent-hover)] transition-colors"
        >
          Open application form
        </Link>
        <p className="text-[var(--muted)] text-sm mt-6">
          Prefer to email? <a href="mailto:admin@pitchiq.live" className="text-[var(--accent)] hover:underline">admin@pitchiq.live</a>
        </p>
      </section>

      <p className="text-center text-[var(--muted)] text-sm mt-8">
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">← Back to dashboard</Link>
      </p>
    </div>
  );
}
