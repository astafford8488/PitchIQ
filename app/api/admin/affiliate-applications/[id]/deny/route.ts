import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Application id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: app } = await admin.from("affiliate_applications").select("status").eq("id", id).single();
  if (!app || app.status !== "pending") {
    return NextResponse.json({ error: "Application not found or already reviewed" }, { status: 400 });
  }

  await admin
    .from("affiliate_applications")
    .update({ status: "denied", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
