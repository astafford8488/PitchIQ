import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET — list current user's contact target list (for pitch flow). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("contact_target_list")
    .select("id, contact_id, created_at, contacts(id, name, email, title, outlet_name, source)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((r) => {
    const c = Array.isArray(r.contacts) ? r.contacts[0] : r.contacts;
    return { id: r.id, contact_id: r.contact_id, created_at: r.created_at, contact: c };
  });
  return NextResponse.json({ rows });
}

/** POST — add contact to target list. Body: { contact_id } */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { contact_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const contactId = body.contact_id;
  if (!contactId) return NextResponse.json({ error: "contact_id required" }, { status: 400 });

  const { error } = await supabase
    .from("contact_target_list")
    .insert({ user_id: user.id, contact_id: contactId });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, message: "Already in list" });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** DELETE — remove from target list. Body: { contact_id } */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { contact_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const contactId = body.contact_id;
  if (!contactId) return NextResponse.json({ error: "contact_id required" }, { status: 400 });

  const { error } = await supabase
    .from("contact_target_list")
    .delete()
    .eq("user_id", user.id)
    .eq("contact_id", contactId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
