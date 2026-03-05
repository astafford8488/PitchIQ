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
| Integrate media/journalist database (e.g. Muck Rack) | ✅ Scaffold | Contacts table, manual add, Discover → Media, pitch from contacts; Muck Rack API optional later |
| Integrate social collab database (creator directories) | 🔨 Stub | Same contacts schema; add source + API when ready |
| Integrate VC database (e.g. Harmonic, Crunchbase) | 🔨 Stub | Same contacts schema; add source + API when ready |
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

## Summary: Remaining (Your Tasks Only)

**Infra / setup (you do):**
1. **Inbound replies** — Wire Cloudflare Email Routing so `replies@...` receives mail → Worker → `POST /api/webhooks/inbound-reply`. See `docs/INBOUND-REPLY-WEBHOOK.md`.
2. **Dedicated sending (optional)** — Per-user subdomain on pitchiq.live; decide pricing for PitchIQ-managed.

**Decisions (when you add verticals):**
3. **Scoring criteria per vertical** — Media, social, VC rules.
4. **Rollout timing** — When to gate/ungate each vertical.

---

## Coding Plan — Done

- Follow-ups table, sequence config UI, cron, tone options
- Click + open tracking; inbound reply webhook (you wire Worker)
- Dashboard, pitches list, upgrade prompt, Stripe tiers, usage metering
- SMTP form, domain verifier, deploy checklist, health endpoint

**Deferred (needs API keys + criteria):** Muck Rack, social collab DB, VC DB — placeholders in Settings → Data sources.

**Migrations:** `supabase/run-all-migrations.sql`; optionally `supabase/click-tracking.sql`, `follow-ups-schema.sql`, `billing-tiers.sql` if not in run-all.
