import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Records a click and redirects. Use: /api/track/click?p=PITCH_ID&u=ENCODED_URL */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pitchId = searchParams.get("p");
  const redirectUrl = searchParams.get("u"); // Optional; if absent, go to /

  if (pitchId) {
    try {
      const supabase = createAdminClient();
      await supabase
        .from("pitches")
        .update({
          first_clicked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", pitchId)
        .is("first_clicked_at", null);
    } catch {
      // Continue to redirect
    }
  }

  const raw = redirectUrl?.trim();
  const target = raw ? decodeURIComponent(raw) : "/";
  const url = !target || target === "/" ? "/" : (target.startsWith("http") ? target : `/${target.replace(/^\//, "")}`);
  return NextResponse.redirect(url, 302);
}
