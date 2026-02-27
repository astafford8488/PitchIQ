import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import dns from "dns/promises";

export const dynamic = "force-dynamic";

function extractDomain(email: string): string | null {
  const m = email.match(/@([^@\s]+)/);
  return m ? m[1].toLowerCase() : null;
}

async function getTxtRecords(domain: string): Promise<string[]> {
  try {
    const records = await dns.resolveTxt(domain);
    return records.flatMap((r) => (Array.isArray(r) ? r : [r]));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.trim().toLowerCase();
  const fromEmail = searchParams.get("from_email")?.trim();

  const checkDomain = domain || (fromEmail ? extractDomain(fromEmail) : null);
  if (!checkDomain) {
    return NextResponse.json({ error: "Provide domain or from_email" }, { status: 400 });
  }

  const [rootTxt, dmarcTxt] = await Promise.all([
    getTxtRecords(checkDomain),
    getTxtRecords(`_dmarc.${checkDomain}`),
  ]);

  const spfRecord = rootTxt.find((r) => r.trim().toLowerCase().startsWith("v=spf1"));
  const dmarcRecord = dmarcTxt.find((r) => r.trim().toLowerCase().startsWith("v=dmarc1"));

  const spf = {
    present: !!spfRecord,
    record: spfRecord ?? null,
    valid: !!spfRecord && spfRecord.includes("v=spf1"),
  };

  const dmarc = {
    present: !!dmarcRecord,
    record: dmarcRecord ?? null,
    valid: !!dmarcRecord && dmarcRecord.includes("v=dmarc1"),
  };

  const dkimNote =
    "DKIM requires a selector from your provider. Add a TXT record at {selector}._domainkey." +
    checkDomain +
    " — check your SMTP provider's docs for the exact selector.";

  return NextResponse.json({
    domain: checkDomain,
    spf,
    dmarc,
    dkim: { note: dkimNote, checked: false },
    healthy: spf.valid && dmarc.valid,
  });
}
