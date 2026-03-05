import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SOURCES = ["manual", "muck_rack", "crunchbase", "harmonic"] as const;

/** GET ?source=manual|muck_rack|... — list contacts (for discover). */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") ?? "manual";
  if (!SOURCES.includes(source as (typeof SOURCES)[number])) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("id, source, name, email, title, outlet_name, created_at")
    .eq("source", source)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data ?? [] });
}

/** POST — create a contact (manual source). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string; email?: string; title?: string; outlet_name?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const source = (body.source ?? "manual") as (typeof SOURCES)[number];
  if (!SOURCES.includes(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      source,
      name: (body.name ?? "").trim() || null,
      email: (body.email ?? "").trim() || null,
      title: (body.title ?? "").trim() || null,
      outlet_name: (body.outlet_name ?? "").trim() || null,
    })
    .select("id, source, name, email, title, outlet_name, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
