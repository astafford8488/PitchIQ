# Podcast Pitch Platform — Webapp ($0 hackathon)

Next.js app with Supabase. **Landing page for guests; full app when logged in.**

**New to this stack?** → See **SETUP-GUIDE.md** for a simple step-by-step walkthrough.

## Quick start

1. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In SQL Editor, run `supabase/schema.sql` then `supabase/seed.sql`.
   - In Auth → URL configuration, add site URL and redirect URL: `http://localhost:3001` and `http://localhost:3001/auth/callback` (app runs on port 3001).
   - Optional: enable Google OAuth in Auth → Providers.

2. **Env**
   - Copy `.env.local.example` to `.env.local`.
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Optional: `OPENAI_API_KEY` for AI pitch generation (otherwise uses a simple template).

3. **Run**
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:3001](http://localhost:3001).

## Flow

- **Not logged in:** Main screen (hero + Log in / Sign up). No app content.
- **Logged in:** Redirect to Dashboard. Nav: Discover, Target list, Pitches, Dashboard, Profile, Log out.
- **Discover:** List podcasts from Supabase (title, category, description, host). Filter by category/search; add to target list.
- **Target list:** Saved podcasts; remove; "Generate pitches" → pick shows → AI or template pitch → copy / mark as sent.
- **Pitches:** List sent pitches; set status (No response, Interested, Declined, Booked).
- **Profile:** Name, bio, expertise, target audience, credentials (used in pitch text).

## Supabase

Schema and field descriptions are in **HACKATHON-OUTLINE.md**. Tables: `podcasts`, `profiles`, `target_list`, `pitches`. RLS so users only see their own data.

## Cost

$0: Supabase free tier, Vercel hobby, optional OpenAI free credits (or template-only pitches).
