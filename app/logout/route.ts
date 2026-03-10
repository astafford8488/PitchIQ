import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin = getRequestOrigin(request);
  return NextResponse.redirect(`${origin}/`, 302);
}
