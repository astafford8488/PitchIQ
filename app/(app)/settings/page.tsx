import { unstable_noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmailSettings } from "./EmailSettings";
import { FollowUpConfig } from "./FollowUpConfig";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  unstable_noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("smtp_server, smtp_port, smtp_security, smtp_username, smtp_password, from_email, sending_tier, follow_up_days, max_follow_ups, follow_up_tone")
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
          sendingTier={(profile?.sending_tier as "own" | "managed") ?? "managed"}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">Follow-up sequences</h2>
        <p className="text-[var(--muted)] text-sm mb-4">
          Configure when and how AI follow-ups are sent for pitches with no response.
        </p>
        <FollowUpConfig
          initial={{
            follow_up_days: profile?.follow_up_days ?? 7,
            max_follow_ups: profile?.max_follow_ups ?? 1,
            follow_up_tone: profile?.follow_up_tone ?? "friendly",
          }}
        />
      </section>
    </div>
  );
}
