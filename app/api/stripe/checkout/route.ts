import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export type BillingTier = "starter" | "growth" | "platinum";

/** Resolve price ID for tier. Starter=$20, Growth=$50, Platinum=$100. */
function getPriceIdForTier(tier: BillingTier | null): string | null {
  const starter = process.env.STRIPE_PRICE_ID_STARTER;
  const platinum = process.env.STRIPE_PRICE_ID_PLATINUM;   // $50 → Growth
  const growth = process.env.STRIPE_PRICE_ID_GROWTH;      // $100 → Platinum
  if (tier === "platinum" && growth) return growth;
  if (tier === "growth" && platinum) return platinum;
  if (tier === "starter" && starter) return starter;
  return process.env.STRIPE_PRICE_ID ?? starter ?? platinum ?? growth ?? null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  let tier: BillingTier | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.tier === "starter" || body.tier === "growth" || body.tier === "platinum") tier = body.tier;
  } catch {
    // no body or invalid JSON: use default
  }

  const priceId = getPriceIdForTier(tier);
  if (!priceId) {
    return NextResponse.json({ error: "No price configured. Set STRIPE_PRICE_ID_STARTER, STRIPE_PRICE_ID_PLATINUM, or STRIPE_PRICE_ID_GROWTH." }, { status: 500 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-01-28.clover" });
  const baseUrl = getRequestOrigin(request);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/billing`,
      customer_email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not create checkout." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Checkout failed." }, { status: 500 });
  }
}