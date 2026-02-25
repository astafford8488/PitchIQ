import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function getBaseUrl(request: Request): string {
  try {
    const url = new URL(request.url);
    return url.origin;
  } catch {
    return "http://localhost:3001";
  }
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

    const stripe = new Stripe(secretKey, { apiVersion: "2026-01-28.clover" });
    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
        return NextResponse.json({ error: "No price configured." }, { status: 500 });
    }

    const baseUrl = getBaseUrl(request);

    try {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${baseUrl}/dashboard?checkout=success`,
            cancel_url: `${baseUrl}/dashboard`,
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