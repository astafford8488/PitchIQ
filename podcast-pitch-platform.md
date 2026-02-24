# 🎙️ Podcast Pitch Platform — MVP

> AI-powered podcast guest outreach at a fraction of the cost of incumbents.

---

## Overview

The Podcast Pitch Platform enables entrepreneurs, creators, authors, coaches, and business owners to secure podcast guest appearances at scale — without a PR team or dedicated VA. Users discover relevant podcasts, generate personalized AI-powered pitches, and send outreach through their own email infrastructure.

**The market opportunity is clear:** the leading incumbent charges $400/month and ships 1–2 features per year. We deliver a superior product at **$50–100/month** with rapid iteration.

---

## Target User

Entrepreneurs, creators, authors, coaches, and small business owners who want to grow their visibility through podcast appearances but lack the time or expertise to do manual outreach. They are:

- Comfortable with technology
- Value their time over money
- Need a solution that works without a dedicated PR team or VA

---

## Core User Flows

### 1. Onboarding
- Sign up via Google OAuth or email/password
- Complete profile: name, bio, expertise/topics, target audience, notable credentials
- Connect email sending credentials (SMTP or integration)
- System performs email domain health check (SPF/DKIM/DMARC) and flags issues

### 2. Podcast Discovery
- Search and filter podcast database by category, audience size, topic, or keywords
- View podcast details: description, host info, contact information, recent episodes
- Save podcasts to a personal target list
- System prevents duplicate outreach to the same podcast

### 3. Pitch Generation & Sending
- Select podcasts from target list
- AI generates a personalized pitch for each podcast based on user profile and podcast context
- User reviews and optionally edits pitches before sending
- User approves and schedules send
- System sends pitches through user's own email, respecting daily limits

### 4. Response Tracking
- Dashboard displays sent pitches, open rates, and response status
- User manually marks responses: **Interested / Declined / Booked / No Response**
- System tracks conversion metrics: pitches sent → responses → bookings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js |
| Backend | Node.js |
| Database | PostgreSQL (Supabase acceptable) |
| Hosting | Vercel or Railway |
| AI | OpenAI API or Anthropic API |
| Email | SMTP or Smartlead API (user's own domain) |
| Billing | Stripe |
| Auth | Google OAuth + email/password |

---

## Technical Requirements

- **Authentication:** Google OAuth and email/password
- **Podcast Database:** Integration with a purchased or crawled podcast database (Listen Notes, Podchaser, or equivalent)
- **Email Sending:** Emails route through the *user's* domain — not platform infrastructure — via SMTP or Smartlead API
- **Domain Health Check:** SPF/DKIM/DMARC verification on the user's sending domain at setup
- **Rate Limiting:** Daily pitch limits enforced per pricing tier (default: 10/day = 300/month)

---

## Pricing Model

| Tier | Price | Volume |
|---|---|---|
| Base | $50–100/month | 300 pitches/month (10/day) |
| Add-on | +$20–30/month | +300 pitches/month per block |

> **MVP Note:** Billing integrates with Stripe. Manual tier assignment is acceptable for initial launch if needed.

---

## Out of Scope for MVP

The following are explicitly excluded to maintain speed and focus:

- Other verticals (newsletters, journalist pitching, VC outreach)
- Team/agency features (multi-seat, white-label)
- Managed email sending or domain provisioning
- Advanced billing beyond simple Stripe subscriptions
- Mobile app or browser extension
- CRM integrations (HubSpot, Salesforce, etc.)
- Advanced analytics or reporting dashboards
- A/B testing of pitch templates
- Bulk import of custom podcast lists
- API access for power users

---

## Build Timeline

| Phase | Deliverable |
|---|---|
| Week 1–2 | Core infrastructure, auth, database schema, podcast DB integration |
| Week 2–3 | Pitch generation, email integration, basic dashboard |
| Week 3–4 | Polish, bug fixes, alpha user onboarding |
| Week 4–8 | Alpha testing with real users, iteration based on feedback |

**Alpha group:** ~12 business owners ready to test immediately upon MVP completion, with real usage data expected within the first 2 weeks of alpha.

---

## Evaluation Criteria

### Technical Quality
- Sensible architecture — not over-engineered or fragile
- Scalable design that supports growth without major rewrites
- Modular code that allows new features without breaking existing functionality
- Clean, maintainable codebase another developer can understand and extend

### Execution Quality
- Speed to functional product within the 2–4 week window
- Sound decision-making under ambiguity
- Clear and frequent communication during the build

### Product Quality (Post-Launch)
- Uptime and reliability under real user load
- Outreach conversion quality — target: **10%+ pitch-to-response rate** among alpha users

---

## Open Questions & Risks

| Area | Risk | Notes |
|---|---|---|
| Podcast Database | Listen Notes vs. Podchaser have different pricing/access models | Needs to be locked in early — biggest technical dependency |
| Email Deliverability | User domain reputation is outside platform control | Domain health check at onboarding mitigates this, but doesn't eliminate it |
| Daily Send Limits | 10/day cap may frustrate power users in active campaigns | Consider burst allowances or configurable limits per tier |
| AI Pitch Quality | Personalization depth depends on available podcast metadata | Richer podcast data = better pitches; worth investing in data quality |
| 10% Conversion Target | Largely dependent on user niche and pitch quality | Treat as aspirational signal, not a hard pass/fail threshold |

---

## Philosophy

This PRD defines core requirements, not every implementation detail. Good architectural and UX judgment within these constraints is expected and encouraged. When the spec is ambiguous, document your reasoning and proceed — or flag it for discussion. **Speed and sound decision-making matter as much as the code itself.**

---

*MVP target launch: 2–4 weeks from kickoff*
