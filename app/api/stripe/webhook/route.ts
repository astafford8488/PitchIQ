import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
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
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
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
            if (userId && (customerId || subscriptionId)) {
                await updateProfileStripe(userId, {
                    stripe_customer_id: customerId ?? undefined,
                    stripe_subscription_id: subscriptionId ?? undefined,
                    stripe_subscription_status: subscriptionId ? "active" : undefined,
                });
            }
            break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            await updateProfileStatusBySubscriptionId(subscription.id, subscription.status);
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
    }
) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    await supabase.from("profiles").update(updates).eq("id", userId);
}

async function updateProfileStatusBySubscriptionId(subscriptionId: string, status: string) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    await supabase
        .from("profiles")
        .update({ stripe_subscription_status: status })
        .eq("stripe_subscription_id", subscriptionId);
}