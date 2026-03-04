import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — config check for deploy verification.
 * Returns booleans only (no secrets). Use to confirm migrations and env are set.
 */
export async function GET() {
  const checks: Record<string, boolean> = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
    supabase_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    cron_secret: !!process.env.CRON_SECRET?.trim(),
    inbound_reply_address: !!process.env.INBOUND_REPLY_ADDRESS?.trim(),
    inbound_reply_secret: !!process.env.INBOUND_REPLY_SECRET?.trim(),
    openai: !!process.env.OPENAI_API_KEY?.trim(),
  };

  let db_ok = false;
  if (checks.supabase_url && checks.supabase_service_role) {
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from("profiles").select("id").limit(1);
      db_ok = !error;
    } catch {
      db_ok = false;
    }
  }

  const ok =
    checks.supabase_url &&
    checks.supabase_anon &&
    checks.supabase_service_role &&
    db_ok;

  return NextResponse.json({
    ok,
    checks: { ...checks, db: db_ok },
  });
}
