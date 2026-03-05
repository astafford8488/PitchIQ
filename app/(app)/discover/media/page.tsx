import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MediaContactsList } from "./MediaContactsList";

export default async function MediaDiscoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, email, title, outlet_name, source, created_at")
    .in("source", ["manual", "muck_rack"])
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: inList } = await supabase
    .from("contact_target_list")
    .select("contact_id")
    .eq("user_id", user.id);

  const inListIds = new Set((inList ?? []).map((r) => r.contact_id));

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/discover" className="text-sm text-[var(--muted)] hover:text-[var(--text)] mb-4 inline-block">← Discover</Link>
      <h1 className="text-2xl font-bold mb-2">Media contacts</h1>
      <p className="text-[var(--muted)] mb-6">Add journalists and media contacts to pitch. Add to your list, then generate pitches from Pitches → New.</p>

      <MediaContactsList
        contacts={contacts ?? []}
        inListIds={Array.from(inListIds)}
      />
    </div>
  );
}
