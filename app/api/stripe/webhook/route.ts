import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

type BillingTier = "starter" | "growth" | "platinum";

/** Map Stripe price ID to billing_tier. STARTER→starter, PLATINUM→growth, GROWTH→platinum. */
function billingTierForPriceId(priceId: string | null): BillingTier | null {
  if (!priceId) return null;
  const starter = process.env.STRIPE_PRICE_ID_STARTER;
  const platinum = process.env.STRIPE_PRICE_ID_PLATINUM;   // $50 → growth
  const growth = process.env.STRIPE_PRICE_ID_GROWTH;      // $100 → platinum
  if (starter && priceId === starter) return "starter";
  if (platinum && priceId === platinum) return "growth";
  if (growth && priceId === growth) return "platinum";
  if (process.env.STRIPE_PRICE_ID && priceId === process.env.STRIPE_PRICE_ID) return "starter";
  return null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let payload: string;
  try {
    payload = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const customerId = session.customer as string | null;
      const subscriptionId = session.subscription as string | null;
      if (!userId || !subscriptionId) break;
      let billingTier: BillingTier = "starter";
      try {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId, { expand: ["items.data.price"] });
        const priceId = subscription.items.data[0]?.price?.id ?? null;
        billingTier = billingTierForPriceId(priceId) ?? "starter";
      } catch {
        // keep starter
      }
      await updateProfileStripe(userId, {
        stripe_customer_id: customerId ?? undefined,
        stripe_subscription_id: subscriptionId,
        stripe_subscription_status: "active",
        billing_tier: billingTier,
      });
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
      const billingTier: BillingTier = billingTierForPriceId(priceId) ?? "starter";
      await updateProfileBySubscriptionId(subscription.id, {
        stripe_subscription_status: subscription.status,
        billing_tier: subscription.status === "active" ? billingTier : "free",
      });
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await updateProfileBySubscriptionId(subscription.id, {
        stripe_subscription_status: subscription.status,
        billing_tier: "free",
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function updateProfileStripe(
  userId: string,
  updates: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    stripe_subscription_status?: string;
    billing_tier?: string;
  }
) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(updates)) if (v != null) clean[k] = v;
  if (Object.keys(clean).length) await supabase.from("profiles").update(clean).eq("id", userId);
}

async function updateProfileBySubscriptionId(
  subscriptionId: string,
  updates: { stripe_subscription_status?: string; billing_tier?: string }
) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(updates)) if (v != null) clean[k] = v;
  if (Object.keys(clean).length) {
    await supabase.from("profiles").update(clean).eq("stripe_subscription_id", subscriptionId);
  }
}