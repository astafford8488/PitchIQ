import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customerId = profile?.stripe_customer_id?.trim();
  if (!customerId) {
    return NextResponse.json(
      { error: "No billing account found. Subscribe first." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-01-28.clover" });
  const baseUrl = getRequestOrigin(request);

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/billing`,
    });
    if (!session.url) {
      return NextResponse.json({ error: "Could not create portal session." }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Portal failed." }, { status: 500 });
  }
}
