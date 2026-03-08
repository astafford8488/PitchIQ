import { unstable_noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmailSettings } from "./EmailSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  unstable_noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("smtp_server, smtp_port, smtp_security, smtp_username, smtp_password, from_email, follow_up_days, max_follow_ups, follow_up_tone")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-[var(--muted)] mb-6">Email and other app settings.</p>

      <section>
        <h2 className="text-xl font-bold mb-4">Email setup</h2>
        <p className="text-[var(--muted)] text-sm mb-4">
          Configure how PitchIQ sends your pitch emails to podcast hosts.
        </p>
        <EmailSettings
          smtpInitial={{
            smtp_server: profile?.smtp_server ?? "",
            smtp_port: profile?.smtp_port ?? 587,
            smtp_security: profile?.smtp_security ?? "Auto",
            smtp_username: profile?.smtp_username ?? "",
            smtp_password: profile?.smtp_password ?? "",
            from_email: profile?.from_email ?? "",
          }}
          followUpInitial={{
            follow_up_days: profile?.follow_up_days ?? 7,
            max_follow_ups: profile?.max_follow_ups ?? 1,
            follow_up_tone: profile?.follow_up_tone ?? "friendly",
          }}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">Data sources</h2>
        <p className="text-[var(--muted)] text-sm mb-4">
          Where PitchIQ gets shows and contacts. More verticals coming soon.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-green-500" aria-hidden>✓</span>
            <span><strong>Podcasts</strong> — Discover, target list, pitch (active)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500" aria-hidden>✓</span>
            <span><strong>Media contacts</strong> — Discover → Media contacts, add & pitch (active)</span>
          </li>
          <li className="flex items-center gap-2 text-[var(--muted)]">
            <span className="text-[var(--muted)]" aria-hidden>·</span>
            <span>Creator / social collab directories — coming soon</span>
          </li>
          <li className="flex items-center gap-2 text-[var(--muted)]">
            <span className="text-[var(--muted)]" aria-hidden>·</span>
            <span>VC / investor DB (e.g. Harmonic, Crunchbase) — coming soon</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
