# Deploy checklist (production)

One place to get PitchIQ running without "column does not exist" or missing-env errors.

## 1. Supabase: run migrations once

In **Supabase** → **SQL Editor** → **New query**, run:

- **Base schema** (if starting fresh): `supabase/schema.sql`, then `supabase/seed.sql`.
- **All optional columns** (Settings, send, onboarding): `supabase/run-all-migrations.sql` (includes onboarding_completed_at so app doesn’t redirect to /onboarding forever).
- **Vertical contacts** (media/VC/creators): `supabase/vertical-contacts.sql`.

If you already ran schema + seed, run **run-all-migrations.sql** then **vertical-contacts.sql**.

## 2. Railway (or your host): env vars

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | For cron + webhooks (Supabase → Settings → API → service_role) |
| `CRON_SECRET` | Yes for follow-ups | Random string; cron job sends it (query or Bearer header) |
| `OPENAI_API_KEY` | Optional | AI pitch/follow-up copy; otherwise templates |
| `INBOUND_REPLY_SECRET` | Optional | For inbound-reply webhook (same value in Cloudflare Worker) |
| `INBOUND_REPLY_ADDRESS` | Optional | e.g. `replies@pitchiq.live` for Option A reply-to |
| Stripe, Listen Notes, etc. | Per feature | See README / TASKS |

## 3. Follow-up cron (optional)

- External cron (e.g. cron-job.org) calls:  
  `https://YOUR-APP-URL/api/cron/follow-ups?secret=YOUR_CRON_SECRET`  
  (or `Authorization: Bearer YOUR_CRON_SECRET`).
- Schedule: daily (e.g. 9:00).

## 4. Inbound replies (optional)

- Cloudflare Email Routing + Worker → `POST /api/webhooks/inbound-reply` with `Email-From`, `Email-To`, `Authorization: Bearer INBOUND_REPLY_SECRET`.
- See **docs/INBOUND-REPLY-WEBHOOK.md**.

## 5. Verify

- **Health:** `GET /api/health` returns which required env and DB checks pass (no secrets).
- **Settings:** Configure SMTP + From email, save. Then send a pitch.
