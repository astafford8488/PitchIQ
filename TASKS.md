# PitchIQ — Task Status

Tasks sorted into **already started** vs **new**, and **your tasks** (decisions/infra you do manually) vs **coding** (implemented in the app).

---

## 1. Auth

| Task | Status | Notes |
|------|--------|-------|
| Email/password sign up & login | ✅ Done | Login + signup pages; auth callback for redirects |
| **Sign in with Google** | ❌ Not done | Supabase Google provider + "Continue with Google" on login/signup |

---

## 2. Onboarding

| Task | Status | Notes |
|------|--------|-------|
| Onboarding wizard (post-signup) | ✅ Done | 3 steps: Basics, Goals & Topics, Past Media & Interests; sets `onboarding_completed_at`; app layout redirects to `/onboarding` when missing; profile upsert + revalidation; error handling |

---

## 6. Email Infrastructure

| Task | Status | Notes |
|------|--------|-------|
| Refine SMTP flow, improve instructions | ✅ Done | SmtpForm, EmailSettings with setup steps, DomainVerifier |
| **Decide on dedicated sending infrastructure pricing** | 🧠 **Your task** | Add-on price for PitchIQ-managed ($X/month) |
| **Set up dedicated sending domain infrastructure** | 🤝 **Your task** | Per-user subdomain on pitchiq.live via Cloudflare Email Routing |
| Build tier selection (own vs PitchIQ-managed) | ✅ Done | EmailSettings radio; managed shows "coming soon" |
| SPF/DKIM/DMARC verification checker | ✅ Done | DomainVerifier component + `/api/email/verify-domain` |

---

## 7. Follow-Up IQ

| Task | Status | Notes |
|------|--------|-------|
| Build `follow_ups` table | ✅ Done | `supabase/follow-ups-schema.sql` |
| Build sequence configuration UI | ✅ Done | Settings → Follow-up sequences (days, count, tone) |
| Background worker (cron) | ✅ Done | Uses `follow_up_days` from profile; runs via `/api/cron/follow-ups` |
| Email open tracking | ✅ Done | Pixel endpoint `/api/track/open` |
| Click tracking (redirect endpoint) | ✅ Done | `/api/track/click`; links in pitch emails wrapped |
| Build inbound reply detection | ✅ Webhook done | `POST /api/webhooks/inbound-reply`; you wire Cloudflare Email Worker → see docs/INBOUND-REPLY-WEBHOOK.md |
| Define follow-up copy templates and tone options | ✅ Done | Tone (friendly/professional/brief) wired; AI + fallback templates; multi-follow-up support |
| Wire dashboard to show sequence status, opens, replies | ✅ Done | Pitch rows show ✓ opened, ↗ clicked, ↻ follow-ups |

---

## 8. Dashboard Completion

| Task | Status | Notes |
|------|--------|-------|
| Define metrics for main view | ✅ Done | Pitches sent, open rate, reply rate, bookings, follow-ups, active sequences |
| Hook UI stubs to real Supabase data | ✅ Done | Dashboard uses real data |
| Outreach history table with status indicators | ✅ Done | Pitches list shows opened, clicked, follow-up badges |
| Booking confirmation flow | ✅ Done | PitchStatusSelect includes "booked"; template success_count updates |

---

## 9. Additional Vertical Databases

| Task | Status | Notes |
|------|--------|-------|
| Integrate media/journalist database (e.g. Muck Rack) | ✅ Scaffold | Contacts table, manual add, Discover → Media, pitch from contacts; Muck Rack API optional later |
| Integrate social collab database (creator directories) | 🔨 Stub | Same contacts schema; add source + API when ready |
| Integrate VC database (e.g. Harmonic, Crunchbase) | 🔨 Stub | Same contacts schema; add source + API when ready |
| **Define scoring criteria per vertical** | 🧠 **Your task** | Differs from podcast scoring |
| **Decide public rollout timing per vertical** | 🧠 **Your task** | Gated rollout |

---

## 11. Billing Activation

| Task | Status | Notes |
|------|--------|-------|
| **Wire Stripe to user tiers (free/starter/growth)** | ❌ Not done | Create products/prices in Stripe; checkout + webhook to set `billing_tier` / `stripe_subscription_status` on profile; `lib/billing.ts` has tier limits ready |
| **Build usage metering against pitch volume limits** | 🔨 Stub | Code exists in lib/billing + generate/send; depends on tiers being wired |
| **Build upgrade prompt when limits approached** | 🔨 Stub | Dashboard component exists; depends on tiers |
| **Decide on dedicated sending infrastructure pricing tier** | 🧠 **Your task** | Add-on pricing |

---

## Summary: Remaining

**Coding (to do):**
1. ~~**Sign in with Google**~~ — Done.
2. ~~**Onboarding wizard**~~ — Done.
3. **Stripe tiers** — Products/prices, checkout, webhook → profile tier; then usage metering + upgrade prompt are already stubbed.

**Infra / setup (you do):**
4. **Inbound replies** — Wire Cloudflare Email Routing → Worker → `POST /api/webhooks/inbound-reply`. See `docs/INBOUND-REPLY-WEBHOOK.md`.
5. **Dedicated sending (optional)** — Per-user subdomain on pitchiq.live; decide pricing for PitchIQ-managed.

**Decisions (when you add verticals):**
6. **Scoring criteria per vertical** — Media, social, VC rules.
7. **Rollout timing** — When to gate/ungate each vertical.

---

## Coding Plan — Done

- Email/password + Google auth; auth callback; request-origin fix for Railway
- Onboarding wizard (3 steps, profile + goals + verticals, redirect when incomplete)
- Follow-ups table, sequence config UI, cron, tone options
- Click + open tracking; inbound reply webhook (you wire Worker)
- Dashboard, pitches list; SMTP form, domain verifier
- Deploy checklist, health endpoint
- Billing: `lib/billing.ts` tier limits + profile columns; Stripe routes exist but tiers not wired

**Deferred (needs API keys + criteria):** Muck Rack, social collab DB, VC DB — placeholders in Settings → Data sources.

**Migrations:** `supabase/run-all-migrations.sql`; optionally `supabase/click-tracking.sql`, `follow-ups-schema.sql`, `billing-tiers.sql` if not in run-all.
