import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PitchForm } from "./PitchForm";

export default async function NewPitchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: targetList } = await supabase
    .from("target_list")
    .select("id, podcast_id, podcasts(id, title, description, category, host_name, topics)")
    .eq("user_id", user.id);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/pitches" className="text-sm text-[var(--muted)] hover:text-[var(--text)] mb-4 inline-block">← Pitches</Link>
      <h1 className="text-2xl font-bold mb-2">Generate pitches</h1>
      <p className="text-[var(--muted)] mb-6">Pick podcasts from your target list. We’ll generate one pitch per show (AI uses your profile + podcast info). Then copy and send from your email, or mark as sent.</p>

      {targetList?.length ? (
        <PitchForm targetList={targetList} />
      ) : (
        <p className="text-[var(--muted)]">Your target list is empty. <Link href="/target-list" className="text-[var(--accent)] hover:underline">Add podcasts</Link> first.</p>
      )}
    </div>
  );
}
