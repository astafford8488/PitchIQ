import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FIELDS = [
  "name",
  "email",
  "phone",
  "audience_size",
  "audience_platforms",
  "website_or_handles",
  "how_heard",
  "notes",
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!name || !email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Name and a valid email are required." },
        { status: 400 }
      );
    }

    const record: Record<string, string | null> = {
      name,
      email,
      status: "pending",
    };
    for (const key of FIELDS) {
      if (key === "name" || key === "email") continue;
      const v = body[key];
      record[key] = v != null && typeof v === "string" ? v.trim() || null : null;
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch (e) {
      console.error("affiliate apply: missing Supabase admin env (SUPABASE_SERVICE_ROLE_KEY)", e);
      return NextResponse.json(
        { error: "Server misconfigured. Please try again later." },
        { status: 500 }
      );
    }
    const { error } = await admin.from("affiliate_applications").insert(record);
    if (error) {
      console.error("affiliate apply insert", error.code, error.message, error.details);
      return NextResponse.json({ error: "Failed to submit. Try again." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("affiliate apply", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
