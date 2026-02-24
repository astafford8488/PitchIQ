import { createClient } from "@/lib/supabase/server";
import { DiscoverSearch } from "./DiscoverSearch";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return <DiscoverSearch />;
}
