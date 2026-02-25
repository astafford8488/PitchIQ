import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
import { ProfileCritique } from "./ProfileCritique";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bio, expertise_topics, target_audience, credentials, linkedin_url, speaking_topics, past_appearances, book_product_links, goals, vertical_interests")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Profile</h1>
      <p className="text-[var(--muted)] mb-6">This info is used to personalize your pitches and AI feedback.</p>
      <ProfileForm
        initial={{
          full_name: profile?.full_name ?? "",
          bio: profile?.bio ?? "",
          expertise_topics: profile?.expertise_topics ?? "",
          target_audience: profile?.target_audience ?? "",
          credentials: profile?.credentials ?? "",
          linkedin_url: profile?.linkedin_url ?? "",
          speaking_topics: profile?.speaking_topics ?? "",
          past_appearances: profile?.past_appearances ?? "",
          book_product_links: profile?.book_product_links ?? "",
          goals: profile?.goals ?? "",
          vertical_interests: profile?.vertical_interests ?? "",
        }}
      />
      <ProfileCritique />
    </div>
  );
}
