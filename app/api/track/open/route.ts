import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// 1x1 transparent GIF
const PIXEL =
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pitchId = searchParams.get("p");
  if (!pitchId) {
    return new NextResponse(Buffer.from(PIXEL, "base64"), {
      headers: { "Content-Type": "image/gif" },
    });
  }

  try {
    const supabase = createAdminClient();
    await supabase
    .from("pitches")
    .update({ opened_at: new Date().toISOString() })
    .eq("id", pitchId)
    .is("opened_at", null);
  } catch {
    // no admin env or DB error; still return pixel
  }

  return new NextResponse(Buffer.from(PIXEL, "base64"), {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store",
    },
  });
}
