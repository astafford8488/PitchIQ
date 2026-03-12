# Stripe tiers setup ($20 / $50 / $100)

Checklist to go from “no Stripe” to working free + three paid tiers with checkout and webhook.

---

## 1. Stripe Dashboard

### Products & prices

You can use **one product with three prices** or **three separate products** (one per tier). The app only cares about the **Price IDs**.

**Option A — One product, three prices**

1. **Product catalog** → **Add product** (e.g. “PitchIQ”).
2. Add **three recurring prices** (monthly): $20, $50, $100. Copy each **Price ID** (`price_...`).

**Option B — Three products**

1. Create three products (e.g. “PitchIQ Starter”, “PitchIQ Pro”, “PitchIQ Growth”).
2. Add one monthly price to each ($20, $50, $100). Copy each **Price ID**.

Either way, you end up with three Price IDs to put in env as `STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_GROWTH`.

### Webhook

5. **Developers** → **Webhooks** → **Add endpoint**.
6. **Endpoint URL:** `https://pitchiq.live/api/stripe/webhook`  
   (for local testing you can use Stripe CLI to forward to `http://localhost:3001/api/stripe/webhook`).
7. **Events to send:**  
   - `checkout.session.completed`  
   - `customer.subscription.updated`  
   - `customer.subscription.deleted`
8. **Add endpoint** → open it → **Reveal** signing secret. Copy the value (starts with `whsec_`).

### API key

9. **Developers** → **API keys** → copy **Secret key** (starts with `sk_`). Use **Restricted** key in production if you prefer.

---

## 2. Supabase

10. **SQL Editor** → run **`supabase/run-all-migrations.sql`** if you haven’t already (adds `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`, `billing_tier` and other columns).

---

## 3. Railway (env)

Set these in your Railway project:

| Variable | Value |
|----------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from step 8) |
| `STRIPE_PRICE_ID_STARTER` | `price_...` ($20/mo) |
| `STRIPE_PRICE_ID_PRO` | `price_...` ($50/mo) |
| `STRIPE_PRICE_ID_GROWTH` | `price_...` ($100/mo) |

Optional: **`STRIPE_PRICE_ID`** can be set as a single fallback (e.g. to Starter) when tier-specific env is missing.

Redeploy after changing env.

---

## 4. App behavior (after code is wired)

- **Checkout:** User clicks “Subscribe” (or “Upgrade”) → POST to `/api/stripe/checkout` with optional `{ "tier": "starter" \| "growth" }` → redirect to Stripe Checkout with the chosen price. On success, Stripe redirects to your `success_url` and sends `checkout.session.completed` to the webhook.
- **Webhook:** On `checkout.session.completed` and `customer.subscription.updated`, the app sets `profiles.stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`, and **`billing_tier`** from the subscription’s price (`starter`, `pro`, or `growth`). On `customer.subscription.deleted`, it sets `stripe_subscription_status` and `billing_tier = 'free'`.
- **Usage:** `lib/billing.ts` defines limits: free 50, starter 50, pro 150, growth 300 (pitches/month). Dashboard and pitch generate/send use these.

---

## 5. Test

- **Test mode:** Use `sk_test_...` and `price_...` test prices. Webhook: use Stripe CLI `stripe listen --forward-to localhost:3001/api/stripe/webhook` and put the printed `whsec_...` in `STRIPE_WEBHOOK_SECRET` for local runs; or add a second webhook endpoint for `https://pitchiq.live/api/stripe/webhook` and use that secret in production.
- Subscribe with test card `4242 4242 4242 4242` → complete checkout → confirm profile has `stripe_subscription_status = active` and `billing_tier = starter` (or `growth`). Cancel in portal → confirm `billing_tier` goes back to `free`.

---

## Quick reference

- **Tier limits:** `lib/billing.ts` → `TIER_LIMITS` (free 50, starter 50, pro 150, growth 300).
- **Checkout:** `app/api/stripe/checkout/route.ts` (uses `STRIPE_PRICE_ID` or tier-specific env).
- **Webhook:** `app/api/stripe/webhook/route.ts` (sets profile Stripe fields + `billing_tier`).
- **Portal:** `app/api/stripe/portal/route.ts` (Manage billing).
