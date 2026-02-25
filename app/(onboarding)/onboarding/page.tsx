import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bio, expertise_topics, target_audience, goals, speaking_topics, past_appearances, vertical_interests")
    .eq("id", user.id)
    .single();

  const verticalInterests = profile?.vertical_interests
    ? String(profile.vertical_interests).split(",").filter(Boolean)
    : [];

  const initial = {
    full_name: profile?.full_name ?? (user.user_metadata?.full_name as string) ?? (user.user_metadata?.name as string) ?? user.email?.split("@")[0] ?? "",
    bio: profile?.bio ?? "",
    expertise_topics: profile?.expertise_topics ?? "",
    target_audience: profile?.target_audience ?? "",
    goals: profile?.goals ?? "",
    speaking_topics: profile?.speaking_topics ?? "",
    past_appearances: profile?.past_appearances ?? "",
    vertical_interests: verticalInterests,
  };

  return <OnboardingWizard initial={initial} />;
}
