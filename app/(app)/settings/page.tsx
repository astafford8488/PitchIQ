import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SmtpForm } from "../profile/SmtpForm";

const YOUTUBE_VIDEO_ID = "ZfEK3WP73eY";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("smtp_server, smtp_port, smtp_security, smtp_username, smtp_password, from_email").eq("id", user.id).single();

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-[var(--muted)] mb-6">Email and other app settings.</p>

      <section>
        <h2 className="text-xl font-bold mb-2">Email (SMTP) setup</h2>
        <p className="text-[var(--muted)] text-sm mb-4">
          Configure your SMTP settings to send pitches from your own email. Watch the video below, then enter your details.
        </p>
        <div className="mb-6">
          <a
            href={`https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline text-sm mb-2 inline-block"
          >
            Watch: https://www.youtube.com/watch?v={YOUTUBE_VIDEO_ID}
          </a>
          <div className="aspect-video w-full max-w-lg rounded-lg overflow-hidden bg-[var(--surface)] border border-[var(--border)]">
            <iframe
              title="SMTP setup video"
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
        <SmtpForm
          initial={{
            smtp_server: profile?.smtp_server ?? "",
            smtp_port: profile?.smtp_port ?? 587,
            smtp_security: profile?.smtp_security ?? "Auto",
            smtp_username: profile?.smtp_username ?? "",
            smtp_password: profile?.smtp_password ?? "",
            from_email: profile?.from_email ?? "",
          }}
        />
      </section>
    </div>
  );
}
