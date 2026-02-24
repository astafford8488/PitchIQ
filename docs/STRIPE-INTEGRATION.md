# Stripe integration guide (expanded)

This doc walks through the **remaining** Stripe steps after you have Checkout working (Subscribe button → Stripe payment page → redirect back). It assumes you already have:

- `stripe` and `@stripe/stripe-js` installed
- `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` in `.env.local`
- `app/api/stripe/checkout/route.ts` and a Subscribe button on the dashboard

---

## Step 5: Webhook — let Stripe tell your app when someone pays

Right now, when a user pays, Stripe redirects them to your `success_url`, but your database doesn’t know they paid. A **webhook** is an HTTP request Stripe sends to your server when events happen (e.g. “checkout completed”, “subscription updated”). Your app will listen for those and update Supabase.

### 5.1 Why the webhook route is different

Stripe signs every webhook request. Your route **must** read the **raw request body** (as bytes/text) and verify the signature. If you parse the body as JSON first, the signature check will fail. In Next.js App Router you need to avoid letting the framework consume the body before you verify.

### 5.2a Admin Supabase client (for the webhook)

The webhook is called by Stripe’s servers, so there is no logged-in user. Your normal Supabase client uses cookies and RLS, so it can’t update `profiles` in the webhook. Create a **service-role** client used only in server code (e.g. the webhook).

1. Get your **service_role** key: Supabase Dashboard → **Project Settings** → **API** → under "Project API keys" find **service_role** (secret). Copy it.
2. Add to `.env.local`: **`SUPABASE_SERVICE_ROLE_KEY=eyJ...`** (never expose this in the browser).
3. Create **`lib/supabase/admin.ts`** with:

```ts
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase admin env");
  return createClient(url, key, { auth: { persistSession: false } });
}
```

Use this client only in API routes that must bypass RLS (e.g. the webhook). Never use it in client components or expose the key.

### 5.2 Create the webhook route

1. Create the file: **`app/api/stripe/webhook/route.ts`**
2. Add this code. In `updateProfileStripe` we use `createAdminClient()` from the step above so the update succeeds without a user session:

```ts
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
```

Make sure you completed **5.2a** (admin client) so these updates run with the service role and are not blocked by RLS.

### 5.3 Get the webhook signing secret

1. Stripe Dashboard → **Developers** → **Webhooks**.
2. Click **Add endpoint**.
3. **Endpoint URL:**  
   - Local: use a tunnel (e.g. `ngrok http 3001`) and put `https://your-ngrok-url.ngrok.io/api/stripe/webhook`.  
   - Production: `https://your-domain.com/api/stripe/webhook`.
4. **Events to send:** Select at least:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Create the endpoint. On the new endpoint’s page, click **Reveal** under **Signing secret**. It starts with `whsec_`.
6. Add to `.env.local`: **`STRIPE_WEBHOOK_SECRET=whsec_...`**

### 5.4 Local testing

Stripe can’t send requests to `localhost`. Options:

- **Stripe CLI:** Install [Stripe CLI](https://stripe.com/docs/stripe-cli), run `stripe login`, then `stripe listen --forward-to localhost:3001/api/stripe/webhook`. The CLI prints a **webhook signing secret** for the forwarded events; use that as `STRIPE_WEBHOOK_SECRET` in `.env.local` while testing locally.
- **ngrok:** Expose your app with `ngrok http 3001`, use the `https://...` URL as the endpoint in the Dashboard, and use the Dashboard’s signing secret for that endpoint.

After changing the secret, restart the dev server.

---

## Step 6: Store Stripe data in Supabase

You need columns on `profiles` (or a separate table) to store Stripe customer and subscription state so the app can know who is paid.

### 6.1 Add columns to `profiles`

Run this in **Supabase Dashboard → SQL Editor** (New query, then Run):

```sql
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text;
```

Optional: add an index if you’ll look up by Stripe customer id:

```sql
create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id) where stripe_customer_id is not null;
```

### 6.2 When each column is set

- **stripe_customer_id:** Set in the webhook when you handle `checkout.session.completed` (from `session.customer`). Optionally also set when you create a Customer in the checkout route and pass `customer` instead of `customer_email`.
- **stripe_subscription_id:** Set from `checkout.session.completed` (`session.subscription`) and updated in `customer.subscription.updated` / `customer.subscription.deleted` to keep the current subscription id.
- **stripe_subscription_status:** Set to `active`, `canceled`, `past_due`, etc., in the same subscription events so you can gate features on `status = 'active'`.

Your webhook handler in Step 5 should update these fields as in the code above (with the admin client so the update succeeds).

---

## Step 7: Use subscription status in the app

Use the stored `stripe_subscription_status` (and optionally `stripe_subscription_id`) to decide what the user can do.

### 7.1 Where to check

- **Server-side:** In API routes or Server Components that control access (e.g. pitch generation, sending), load the user’s profile and check `stripe_subscription_status === 'active'`. If not active, return 403 or a “Upgrade to continue” message.
- **Client-side:** Optionally call an API that returns something like `{ isActive: boolean }` (based on the same profile row) so the UI can show “Subscribe” vs “Subscribed” or hide/disable paid features.

### 7.2 Example: gate pitch generation

In `app/api/pitches/generate/route.ts`, after you load the user and profile, add:

```ts
const subscriptionStatus = profile?.stripe_subscription_status;
if (subscriptionStatus !== "active") {
  return NextResponse.json(
    { error: "Active subscription required. Subscribe to generate pitches." },
    { status: 403 }
  );
}
```

(Ensure the profile select includes `stripe_subscription_status`.)

### 7.3 Example: show “Subscribed” on the dashboard

In the dashboard, you can load `profile.stripe_subscription_status` and, if it’s `active`, show “Subscribed” next to the Subscribe button or replace the button with a “Manage billing” link (Step 8) instead of offering checkout again.

---

## Step 8: Optional — Customer Portal (“Manage billing”)

So paid users can cancel or update payment method without you building a full billing UI.

### 8.1 Create the portal route

1. Create **`app/api/stripe/portal/route.ts`**.
2. User must be logged in. Load their `stripe_customer_id` from `profiles`. If they don’t have one, return an error (e.g. “No billing account”).
3. Call Stripe:

```ts
const session = await stripe.billingPortal.sessions.create({
  customer: stripe_customer_id,
  return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/dashboard`,
});
return NextResponse.json({ url: session.url });
```

4. Frontend: a “Manage billing” button that POSTs to `/api/stripe/portal` and redirects to `response.url`.

### 8.2 When to show Subscribe vs Manage billing

- If `stripe_subscription_status === 'active'`, show “Manage billing” (portal).
- Otherwise show “Subscribe” (checkout).

---

## Step 9: Security and env checklist

- **Never** expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` to the client. Use them only in server code (API routes).
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Use it only in the webhook (or other server-only code).
- In production (e.g. Netlify), add all required env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and existing Supabase/OpenAI vars.
- Webhook URL in Stripe Dashboard for production must use HTTPS and your real domain.

---

## Step 10: Order of implementation (summary)

1. **Done:** Checkout route + Subscribe button.
2. **Next:** Add Stripe columns to `profiles` (Step 6.1).
3. **Next:** Create webhook route; add admin Supabase client for webhook; handle `checkout.session.completed` and subscription events; set `STRIPE_WEBHOOK_SECRET` (Step 5).
4. **Next:** In the webhook, update `profiles` with `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status` (Step 6.2).
5. **Next:** In your app, gate features and UI using `stripe_subscription_status` (Step 7).
6. **Optional:** Portal route + “Manage billing” button (Step 8).

---

## Quick reference: env vars

| Variable                         | Where it’s used        | Notes                                      |
|----------------------------------|------------------------|--------------------------------------------|
| `STRIPE_SECRET_KEY`              | Checkout, webhook      | Server only                                |
| `STRIPE_PRICE_ID`                | Checkout               | From Stripe Product → Price                |
| `STRIPE_WEBHOOK_SECRET`          | Webhook route          | From Developers → Webhooks → Signing secret|
| `NEXT_PUBLIC_APP_URL`            | Checkout, portal       | Production URL for success/cancel/return   |
| `SUPABASE_SERVICE_ROLE_KEY`      | Webhook only           | For updating profiles without a user session|

---

## Files created (summary)

| Path                              | Purpose                                  |
|-----------------------------------|------------------------------------------|
| `app/api/stripe/checkout/route.ts`| Create Checkout Session, return URL      |
| `app/api/stripe/webhook/route.ts` | Receive Stripe events, update profiles   |
| `app/api/stripe/portal/route.ts`  | (Optional) Create Portal Session         |
| `app/(app)/dashboard/SubscribeButton.tsx` | Button that calls checkout and redirects |
| `lib/supabase/admin.ts`           | Service-role Supabase client for webhook |

Plus: Supabase migration for `profiles.stripe_*` columns (Step 6.1).
