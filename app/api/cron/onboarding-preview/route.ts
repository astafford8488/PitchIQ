import { NextResponse } from "next/server";
import {
  getAppUrlFromEnv,
  ONBOARDING_TEMPLATE_KEYS,
  renderOnboardingTemplate,
  type OnboardingTemplateKey,
} from "@/lib/onboarding-email-templates";

export const dynamic = "force-dynamic";

function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7) === secret;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const key = (url.searchParams.get("template") ?? "welcome") as OnboardingTemplateKey;
  if (!ONBOARDING_TEMPLATE_KEYS.includes(key)) {
    return NextResponse.json(
      { error: `Invalid template. Use one of: ${ONBOARDING_TEMPLATE_KEYS.join(", ")}` },
      { status: 400 }
    );
  }

  const fullName = url.searchParams.get("name") ?? "Andrew";
  const appUrl = getAppUrlFromEnv();
  const rendered = renderOnboardingTemplate(key, fullName, appUrl);
  return new NextResponse(rendered.html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Template-Subject": rendered.subject,
    },
  });
}
