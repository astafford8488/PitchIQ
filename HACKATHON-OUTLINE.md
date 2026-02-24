# 🎙️ Podcast Pitch Platform — Hackathon ($0) Outline

> Same product idea as the main MVP, but **zero recurring cost** for a hackathon build. All services below use free tiers.

---

## App Summary

**What it does:** Users (entrepreneurs, creators, coaches, etc.) find podcasts, get AI-generated personalized pitch emails, and send outreach via their own email. Track sent pitches and responses in a simple dashboard.

**Core flows:** Sign up → set profile (bio, topics, audience) → discover/filter podcasts → save to target list → generate & review pitches → send (through user’s SMTP) → mark response status (Interested / Declined / Booked / No Response).

---

## $0 Stack (Hackathon Version)

| Layer | Choice | Why $0 |
|-------|--------|--------|
| **Frontend** | Next.js | Free to build & host. |
| **Backend** | Next.js API routes / Server Actions | No separate backend cost. |
| **Database** | **Supabase** (Postgres) | Free tier: 500MB DB, 50K MAU, 2 projects. |
| **Auth** | Supabase Auth | Included: email/password + Google OAuth (no extra cost). |
| **Hosting** | Vercel | Free hobby tier. |
| **AI** | OpenAI API **or** Anthropic | Use free credits (trial / hackathon programs); cap usage (e.g. 10 pitches/day) to stay within free tier. |
| **Email** | User’s own SMTP (Gmail, etc.) | No platform email cost; user brings their own. |
| **Billing** | None | No Stripe for hackathon; skip payments. |

**Optional $0 alternatives:**  
- AI: use a single provider’s free tier (e.g. OpenAI free credits) and hard-cap daily pitch count.  
- If you need “email sending” without user SMTP for demos only: Resend/SendGrid free tier (e.g. 100 emails/day) for demo; real product still uses user’s SMTP.

---

## Supabase: Basic Podcast Data

Podcast records live in Supabase. Below is a minimal schema and what each field is for.

### Table: `podcasts`

| Column | Type | Purpose |
|--------|------|--------|
| `id` | `uuid` (PK) | Unique podcast id. |
| `title` | `text` | Show name. |
| `description` | `text` | Show description (for search & AI context). |
| `website_url` | `text` | Main site or show page. |
| `rss_feed_url` | `text` | Optional; for future episode sync. |
| `cover_image_url` | `text` | Artwork URL. |
| `category` | `text` | e.g. Business, Marketing, Health. |
| `topics` | `text[]` or `text` | Tags/keywords (search & filters). |
| `host_name` | `text` | Primary host. |
| `host_email` | `text` | Contact for pitch (nullable). |
| `contact_url` | `text` | “Contact us” or booking page. |
| `listener_tier` | `text` | e.g. "small" / "mid" / "large" if you have it; else nullable. |
| `created_at` | `timestamptz` | Row created. |
| `updated_at` | `timestamptz` | Row updated. |

**Basic info “per podcast” you’d show in the app:**  
- **Discovery list:** `title`, `category`, `cover_image_url`, `description` (truncated).  
- **Detail page:** All of the above plus `host_name`, `host_email`, `contact_url`, `website_url`, `topics`.  
- **Pitch generation:** `title`, `description`, `category`, `topics`, `host_name` (and optionally recent episodes if you add an `episodes` table later).

### Other tables you’ll need (short)

- **`profiles`** — User profile (bio, expertise, target audience, credentials); keyed by Supabase Auth `id`.
- **`target_list`** — User ↔ podcast many-to-many (user_id, podcast_id, created_at); prevents duplicate outreach per user.
- **`pitches`** — Sent pitches: user_id, podcast_id, subject, body, sent_at, status (e.g. pending / interested / declined / booked / no_response).

RLS (Row Level Security) on all tables so users only see their own data.

---

## Scope for Hackathon (Trimmed)

**In scope**

- Auth (Supabase: email/password + Google).
- Simple profile form (name, bio, topics, target audience).
- Podcast list: load from Supabase; filter by category/topics (no paid podcast API; use seed data or a one-time import).
- Target list: save/remove podcasts; no duplicate outreach to same show.
- Pitch flow: select N from target list → AI generates one pitch per podcast (using profile + podcast fields above) → user edits (optional) → “Send” (user’s SMTP or Resend free tier for demo).
- Basic dashboard: list sent pitches, status dropdown (Interested / Declined / Booked / No Response).

**Out of scope for $0 hackathon**

- Stripe / any billing.
- Domain health checks (SPF/DKIM/DMARC); optional “nice to have” later.
- Rate limiting beyond a simple daily cap (e.g. 10/day in code).
- Listen Notes / Podchaser (paid); use Supabase-only seed data.
- Team/agency, CRM, API, A/B tests, advanced analytics.

---

## Data Source for Podcasts (No Extra Cost)

- **Option A:** Manually seed 50–200 podcasts into `podcasts` (scrape or type from public sources; one-time).
- **Option B:** Use a free API with a generous free tier (e.g. Apple Podcasts lookup, or a limited free tier of another API) and backfill into Supabase once; then read only from Supabase.
- **Option C:** CSV import script: parse CSV → insert into `podcasts`; then run the app entirely off Supabase.

No recurring paid podcast API = $0.

---

## Checklist (Hackathon)

1. Supabase project (free); create `podcasts`, `profiles`, `target_list`, `pitches`; enable RLS.
2. Seed `podcasts` with at least 20–50 rows (title, description, category, host_name, host_email or contact_url, etc.).
3. Auth (Supabase) + profile CRUD.
4. Discovery UI: list + filters (category, topics); podcast detail with basic info from table above.
5. Target list (add/remove from Supabase).
6. Pitch: select from target list → call AI (free tier, capped) → show draft → send via user SMTP or Resend demo.
7. Dashboard: sent pitches + status update.
8. Deploy frontend to Vercel (free); env: `NEXT_PUBLIC_SUPABASE_*`, AI key, optional Resend key.

---

*This outline keeps the app aligned with `podcast-pitch-platform.md` while ensuring $0 cost for the hackathon and defining the basic Supabase podcast fields you need.*
