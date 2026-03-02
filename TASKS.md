# PitchIQ — Task Status

Tasks sorted into **already started** vs **new**, and **your tasks** (decisions/infra you do manually) vs **coding** (implemented in the app).

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
| Integrate media/journalist database (e.g. Muck Rack) | 🔨 New | Internal/colleague access first |
| Integrate social collab database (creator directories) | 🔨 New | Internal first |
| Integrate VC database (e.g. Harmonic, Crunchbase) | 🔨 New | Internal first |
| **Define scoring criteria per vertical** | 🧠 **Your task** | Differs from podcast scoring |
| **Decide public rollout timing per vertical** | 🧠 **Your task** | Gated rollout |

---

## 11. Billing Activation

| Task | Status | Notes |
|------|--------|-------|
| Wire Stripe to user tiers (free/starter/growth) | ✅ Done | `billing_tier` in profiles; active sub = starter; `lib/billing.ts` |
| Build usage metering against pitch volume limits | ✅ Done | Monthly limits enforced in generate + send |
| Build upgrade prompt when limits approached | ✅ Done | Dashboard shows when near 80% of limit |
| **Decide on dedicated sending infrastructure pricing tier** | 🧠 **Your task** | Add-on pricing |

---

## Summary: Your Tasks Only

These require your input (decisions) or your setup (infra):

1. **Decide on dedicated sending infrastructure pricing** — add-on $X/month for PitchIQ-managed.
2. **Set up dedicated sending domain infrastructure** — Cloudflare Email Routing, per-user subdomains.
3. **Build inbound reply detection** — Cloudflare Email Routing → webhook; we’ll add the webhook endpoint.
4. **Define follow-up copy templates and tone options** — write content; we wire into UI.
5. **Define scoring criteria per vertical** — media, social, VC scoring rules.
6. **Decide public rollout timing per vertical** — when to gate/ungate each.

---

## Coding Plan (What We’re Implementing)

1. Done: `follow_ups` table — run `supabase/follow-ups-schema.sql`
2. Done: Sequence config UI — Settings → Follow-up sequences
3. Done: Click tracking — `/api/track/click`; links in emails wrapped automatically
4. Done: Dashboard/pitches — Upgrade prompt, opened/clicked/follow-up badges on rows
5. Done: Stripe tiers + usage metering — `lib/billing.ts`; run `supabase/billing-tiers.sql`
6. Deferred: Vertical DB integrations (needs API keys, scoring criteria)

**Also run:** `supabase/click-tracking.sql`
